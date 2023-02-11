import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import onChange from 'on-change';
import _ from 'lodash';
import ru from './locales/ru.js';
import parse from './parsers.js';
import createFeedBlock from './renders/renders-feeds.js';
import { createPostBlock, makeUpdatedRendering } from './renders/renders-posts.js';
import callModal from './renders/modal.js';

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const getFeedId = (feedsId, channel) => {
  if (feedsId.length === 0) return false;
  let feedId;
  feedsId.forEach((obj) => {
    const { title, id } = obj;
    if (title === channel) feedId = id;
    return null;
  });
  return feedId;
};

export default () => {
  const elements = {
    lead: document.querySelector('.lead'),
    form: document.querySelector('form'),
    input: document.getElementById('url-input'),
    display3: document.querySelector('.display-3'),
    exampleP: document.querySelector('.mt-2'),
    btn: document.querySelector('button[type="submit"]'),
    dangerP: document.querySelector('.feedback'),
    postsDiv: document.querySelector('.posts'),
  };

  const i18nInst = i18n.createInstance();
  i18nInst.init({
    lng: 'ru',
    debug: false,
    resources: {
      ru,
    },
  }, (err, t) => {
    if (err) return console.log('something went wrong loading', err);
    elements.lead.textContent = i18nInst.t('keyLead');
    elements.display3.textContent = i18nInst.t('keyHeader');
    elements.exampleP.textContent = i18nInst.t('keyExample');
    elements.btn.textContent = i18nInst.t('keyBtn');
    return t('key');
  });

  const state = {
    handlingProcess: {
      state: 'filling',
    },
    form: {
      valid: true,
      errors: {
        yupError: '',
        invalidRss: '',
      },
    },
    data: {
      feedsId: [],
      responseFeeds: null,
      responsePosts: null,
      trueLinks: [],
    },
    final: false,
    mutation: false,
  };

  // eslint-disable-next-line
  const watchedState = onChange(state, (path) => {
    if (state.form.valid === false) {
      elements.dangerP.textContent = state.form.errors.yupError;
      elements.input.classList.add('error');
      elements.dangerP.classList.remove('text-success');
      elements.dangerP.classList.add('text-danger');
    }

    if (state.handlingProcess.state === 'processing') {
      elements.dangerP.textContent = '';
      elements.input.classList.remove('error');
      elements.input.setAttribute('disabled', '');
      elements.btn.setAttribute('disabled', '');
    }
    if (state.handlingProcess.state === 'filling') {
      elements.input.removeAttribute('disabled');
      elements.btn.removeAttribute('disabled');
      elements.input.focus();
    }

    if (state.handlingProcess.state === 'failed') {
      elements.dangerP.classList.remove('text-success');
      elements.dangerP.classList.add('text-danger');
      elements.dangerP.textContent = state.form.errors.invalidRss;
    }

    if (state.handlingProcess.state === 'success'
    && state.final) {
      elements.input.classList.remove('error');
      elements.dangerP.classList.remove('text-danger');
      elements.dangerP.classList.add('text-success');
      elements.dangerP.textContent = i18nInst.t('valid');
      createFeedBlock(
        '.feeds',
        state.data.responseFeeds,
        state.data.feedsId,
        i18nInst.t('keyFeeds'),
      );
      createPostBlock(
        '.posts',
        state.data.responsePosts,
        i18nInst.t('keyPosts'),
        i18nInst.t('btnPosts'),
      );

      const uniq = _.uniq(state.data.trueLinks);
      const getNewsUpdate = (links) => {
        const billet = links.map((link) => addProxy(link));
        const urls = billet.map((url) => axios(url)
          .then((response) => response));

        Promise.all(urls)
          .then((data) => {
            data.forEach((item) => {
              const info = parse(item);
              const { posts, titlefeed } = info;
              const feedId = getFeedId(state.data.feedsId, titlefeed);
              posts.forEach((post) => {
                post.feedId = feedId;
              });
              makeUpdatedRendering(posts, elements.postsDiv, i18nInst.t('btnPosts'));
            });
          })
          .then(() => {
            const liButtons = elements.postsDiv.querySelectorAll('.btn-sm');
            liButtons.forEach((btn) => {
              btn.addEventListener('click', () => {
                callModal(btn, i18nInst.t('modal.primary'), i18nInst.t('modal.secondary'));
              });
            });
            const linksLi = elements.postsDiv.querySelectorAll('li a');
            linksLi.forEach((link) => {
              link.addEventListener('click', () => {
                link.classList.remove('fw-bold');
                link.classList.add('fw-normal');
                link.classList.add('visited');
              });
            });
          })
          .catch((error) => {
            console.log(error);
          });
        setTimeout(getNewsUpdate, 5000, links);
      };
      setTimeout(() => getNewsUpdate(uniq), 5000);
    }

    if (state.mutation === true) {
      const liButtons = elements.postsDiv.querySelectorAll('.btn-sm');
      liButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          callModal(btn, i18nInst.t('modal.primary'), i18nInst.t('modal.secondary'));
        });
      });
      const links = elements.postsDiv.querySelectorAll('li a');
      links.forEach((link) => {
        link.addEventListener('click', () => {
          link.classList.remove('fw-bold');
          link.classList.add('fw-normal');
          link.classList.add('visited');
        });
      });
    }
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputValue = elements.input.value.trim();

    const schema = yup.object({
      feedUrl: yup.string().url(i18nInst.t('errTexts.errUrl'))
        .notOneOf(
          watchedState.data.trueLinks,
          i18nInst.t('errTexts.errFeed'),
        )
        .required(i18nInst.t('errTexts.required')),
    });

    schema.validate({ feedUrl: inputValue })
      .then((link) => {
        watchedState.handlingProcess.state = 'processing';
        watchedState.final = false;

        const url = addProxy(link.feedUrl);
        axios.get(url, { timeout: 12000 })
          .then((response) => {
            const data = parse(response);
            const { feed, posts } = data;
            const feedId = _.uniqueId('feed_');
            feed.id = feedId;
            watchedState.data.responseFeeds = feed;

            posts.forEach((post) => {
              post.feedId = feedId;
              post.id = _.uniqueId('post_');
            });
            watchedState.form.valid = true;
            watchedState.form.errors.yupError = '';
            watchedState.data.responsePosts = posts;
            if (navigator.onLine) {
              watchedState.data.trueLinks.push(link.feedUrl);
            }
            watchedState.handlingProcess.state = 'success';
          })
          .catch((err) => {
            if (err.message === 'Error null') {
              watchedState.data.responseFeeds = null;
              watchedState.data.responsePosts = null;
            }
            if (err.message === 'Empty RSS') {
              watchedState.handlingProcess.state = 'failed';
              watchedState.form.errors.invalidRss = i18nInst.t('errTexts.invalid');
            } else {
              watchedState.handlingProcess.state = 'failed';
              watchedState.form.errors.invalidRss = i18nInst.t('errTexts.networkErr');
            }
          })
          .finally(() => {
            watchedState.final = true;
            watchedState.handlingProcess.state = 'filling';
          });
      })
      .catch((err) => {
        watchedState.form.valid = false;
        watchedState.form.errors.yupError = err.message;
      });
  });

  elements.input.addEventListener('input', () => {
    watchedState.handlingProcess.state = 'filling';
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') watchedState.mutation = true;
    });
  });
  const config = { attributes: true, childList: true, characterData: true };
  observer.observe(elements.postsDiv, config);
};
