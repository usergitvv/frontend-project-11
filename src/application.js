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
  const i18nInst = i18n.createInstance();
  i18nInst.init({
    lng: 'ru',
    debug: false,
    resources: {
      ru,
    },
  }, (err, t) => {
    if (err) return console.log('something went wrong loading', err);
    return t('key');
  });

  elements.lead.textContent = i18nInst.t('keyLead');
  elements.display3.textContent = i18nInst.t('keyHeader');
  elements.exampleP.textContent = i18nInst.t('keyExample');
  elements.btn.textContent = i18nInst.t('keyBtn');

  const state = {
    feedsId: [],
    yupError: '',
    networkErr: '',
    responseFeeds: null,
    responsePosts: null,
    responseStatus: 200,
    trueLinks: [],
    errOfRepeat: '',
    startBuilding: false,
    process: 'wait',
    final: false,
    emptyRSS: false,
    mutation: false,
  };

  // eslint-disable-next-line
  const watchedState = onChange(state, (path) => {
    if (state.yupError) {
      elements.dangerP.textContent = state.yupError;
      elements.input.classList.add('error');
      elements.dangerP.classList.remove('text-success');
      elements.dangerP.classList.add('text-danger');
    }
    if (state.yupError === '') {
      elements.input.classList.remove('error');
    }

    if (state.process === 'processing') {
      elements.input.classList.remove('error');
      elements.input.setAttribute('disabled', '');
      elements.btn.setAttribute('disabled', '');
      elements.dangerP.textContent = '';
    }
    if (state.process === 'wait') {
      elements.input.removeAttribute('disabled');
      elements.btn.removeAttribute('disabled');
    }

    if (state.process === 'wait'
    && elements.dangerP.textContent === i18nInst.t('valid')) {
      elements.input.focus();
    }

    if (state.emptyRSS === true) {
      elements.dangerP.classList.remove('text-success');
      elements.dangerP.classList.add('text-danger');
      elements.dangerP.textContent = i18nInst.t('errTexts.invalid');
    }

    if (state.startBuilding === true && state.yupError === ''
      && state.final === true) {
      elements.input.classList.remove('error');
      elements.dangerP.classList.remove('text-danger');
      elements.dangerP.classList.add('text-success');
      elements.dangerP.textContent = i18nInst.t('valid');
      createFeedBlock(
        state.errOfRepeat,
        '.feeds',
        state.responseFeeds,
        state.feedsId,
        i18nInst.t('keyFeeds'),
      );
      createPostBlock(
        state.errOfRepeat,
        '.posts',
        state.responsePosts,
        i18nInst.t('keyPosts'),
        i18nInst.t('btnPosts'),
      );
      state.startBuilding = false;
      state.final = false;

      const uniq = _.uniq(state.trueLinks);
      const getNewsUpdate = (links) => {
        const billet = links.map((link) => addProxy(link));
        const urls = billet.map((url) => axios(url)
          .then((response) => response));

        Promise.all(urls)
          .then((data) => {
            data.forEach((item) => {
              const info = parse(item);
              const [, posts, , channel] = info;
              const feedId = getFeedId(state.feedsId, channel);
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

    if (state.networkErr || state.responseStatus !== 200) {
      elements.dangerP.classList.remove('text-success');
      elements.dangerP.classList.add('text-danger');
      elements.dangerP.textContent = i18nInst.t('errTexts.networkErr');
    }
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    watchedState.responseFeeds = null;
    watchedState.responsePosts = null;
    watchedState.process = 'processing';
    watchedState.yupError = '';
    watchedState.errOfRepeat = '';
    watchedState.startBuilding = false;
    watchedState.final = false;
    watchedState.emptyRSS = false;
    watchedState.networkErr = '';
    watchedState.responseStatus = 200;

    const inputValue = elements.input.value;

    const schema = yup.object({
      feedUrl: yup.string().url(i18nInst.t('errTexts.errUrl'))
        .notOneOf(
          watchedState.trueLinks,
          i18nInst.t('errTexts.errFeed'),
        )
        .required(i18nInst.t('errTexts.required')),
    });
    schema.validate({ feedUrl: inputValue })
      .then((feed) => feed)
      .catch((err) => {
        watchedState.yupError = err.message;
        if (err.message === i18nInst.t('errTexts.errFeed')) {
          watchedState.errOfRepeat = true;
        }
      });

    const link = inputValue.trim();
    const url = addProxy(link);
    axios.get(url, { timeout: 12000 })
      .then((response) => {
        const data = parse(response);
        const [feed, posts, status] = data;
        const feedId = _.uniqueId('feed_');
        feed[0].id = feedId;
        watchedState.responseFeeds = feed;

        posts.forEach((post) => {
          post.feedId = feedId;
          post.id = _.uniqueId('post_');
        });
        watchedState.responsePosts = posts;
        watchedState.startBuilding = true;
        watchedState.responseStatus = status;
        if (navigator.onLine) {
          watchedState.trueLinks.push(link);
        }
      })
      .catch((err) => {
        if (err.message === 'Error null') {
          watchedState.responseFeeds = null;
          watchedState.responsePosts = null;
        }
        if (err.message === 'Empty RSS') watchedState.emptyRSS = true;
        if (err.message === 'Network Error'
        || err.message === 'timeout of 12000ms exceeded') watchedState.networkErr = err.message;
      })
      .finally(() => {
        watchedState.final = true;
        watchedState.process = 'wait';
      });
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') watchedState.mutation = true;
    });
  });
  const config = { attributes: true, childList: true, characterData: true };
  observer.observe(elements.postsDiv, config);
};
