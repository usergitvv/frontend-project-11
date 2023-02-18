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
import { addProxy, getFeedId, changeLinkStyle } from './utils.js';

const addModal = (postsDiv, primary, secondary) => {
  const liButtons = postsDiv.querySelectorAll('.btn-sm');
  return liButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      callModal(btn, primary, secondary);
    });
  });
};

export default () => {
  const i18nInst = i18n.createInstance();

  i18nInst.init({
    lng: 'ru',
    debug: false,
    resources: {
      ru,
    },
  })
    .then(() => {
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

      elements.lead.textContent = i18nInst.t('keyLead');
      elements.display3.textContent = i18nInst.t('keyHeader');
      elements.exampleP.textContent = i18nInst.t('keyExample');
      elements.btn.textContent = i18nInst.t('keyBtn');

      const state = {
        handlingProcess: {
          state: 'waiting',
          requestEnd: false,
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
          visitedLinks: [],
        },
        updatedData: {
          isUpdated: false,
          updatedPosts: undefined,
        },
      };

      // eslint-disable-next-line
      const watchedState = onChange(state, (path) => {
        if (state.form.valid === false) {
          elements.dangerP.textContent = state.form.errors.yupError;
          elements.input.classList.add('error');
          elements.dangerP.classList.remove('text-success');
          elements.dangerP.classList.add('text-danger');
        }

        const visited = _.uniq(state.data.visitedLinks);
        if (state.handlingProcess.state === 'processing') {
          elements.dangerP.textContent = '';
          elements.input.classList.remove('error');
          elements.input.setAttribute('disabled', '');
          elements.btn.setAttribute('disabled', '');
          changeLinkStyle(elements.postsDiv, visited);
        }
        if (state.handlingProcess.state === 'waiting') {
          elements.input.removeAttribute('disabled');
          elements.btn.removeAttribute('disabled');
          elements.input.focus({ preventScroll: true });
          changeLinkStyle(elements.postsDiv, visited);
        }

        if (state.handlingProcess.state === 'failed') {
          elements.dangerP.classList.remove('text-success');
          elements.dangerP.classList.add('text-danger');
          elements.dangerP.textContent = state.form.errors.invalidRss;
        }

        if (state.handlingProcess.state === 'success'
         && state.handlingProcess.requestEnd) {
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

          addModal(elements.postsDiv, i18nInst.t('modal.primary'), i18nInst.t('modal.secondary'));
          changeLinkStyle(elements.postsDiv, visited);
        }

        if (state.updatedData.isUpdated) {
          makeUpdatedRendering(state.updatedData.updatedPosts, elements.postsDiv, i18nInst.t('btnPosts'));
          addModal(elements.postsDiv, i18nInst.t('modal.primary'), i18nInst.t('modal.secondary'));
          changeLinkStyle(elements.postsDiv, visited);
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
          .then((request) => {
            watchedState.handlingProcess.state = 'processing';
            watchedState.handlingProcess.requestEnd = false;

            const reqUrl = addProxy(request.feedUrl);
            axios.get(reqUrl, { timeout: 12000 })
              .then((response) => {
                const data = parse(response);
                const { feed, posts } = data;
                const feedId = _.uniqueId('feed_');
                feed.id = feedId;
                watchedState.data.responseFeeds = feed;

                const postsWithId = posts.map((post) => {
                  post.feedId = feedId;
                  post.id = _.uniqueId('post_');
                  return post;
                });
                watchedState.form.valid = true;
                watchedState.form.errors.yupError = '';
                watchedState.data.responsePosts = postsWithId;
                if (navigator.onLine) {
                  watchedState.data.trueLinks.push(request.feedUrl);
                }
                watchedState.handlingProcess.state = 'success';

                const getNewsUpdate = (links) => {
                  const urls = links.map((link) => addProxy(link))
                    .map((url) => axios(url));

                  Promise.all(urls)
                    .then((answer) => Promise.resolve(answer))
                    .then((news) => {
                      const updatedNews = [];
                      news.forEach((issue) => {
                        const info = parse(issue);
                        // eslint-disable-next-line
                        const { posts, titlefeed } = info;                       
                        const idOfFeed = getFeedId(state.data.feedsId, titlefeed);

                        const newPostsWithId = posts.map((post) => {
                          post.feedId = idOfFeed;
                          post.id = _.uniqueId('post_');
                          return post;
                        });
                        updatedNews.push(newPostsWithId);
                      });
                      const newLinks = elements.postsDiv.querySelectorAll('li a');
                      newLinks.forEach((link) => {
                        link.addEventListener('click', () => {
                          watchedState.data.visitedLinks.push(link.dataset.postid);
                        });
                      });
                      watchedState.updatedData.updatedPosts = updatedNews;
                      watchedState.updatedData.isUpdated = true;
                    })
                    .catch((error) => {
                      watchedState.updatedData.isUpdated = false;
                      console.log(error);
                    })
                    .finally(() => {
                      setTimeout(() => getNewsUpdate(links), 5000);
                    });
                };
                setTimeout(() => getNewsUpdate(watchedState.data.trueLinks), 5000);
              })
              .catch((err) => {
                if (err.message === 'Empty RSS') {
                  watchedState.form.valid = true;
                  watchedState.handlingProcess.state = 'failed';
                  watchedState.form.errors.invalidRss = i18nInst.t('errTexts.invalid');
                } else {
                  watchedState.form.valid = true;
                  watchedState.handlingProcess.state = 'failed';
                  watchedState.form.errors.invalidRss = i18nInst.t('errTexts.networkErr');
                }
              })
              .finally(() => {
                watchedState.handlingProcess.requestEnd = true;
                watchedState.handlingProcess.state = 'waiting';
              });
          })
          .catch((err) => {
            watchedState.form.valid = false;
            watchedState.form.errors.yupError = err.message;
          });
      });

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const links = elements.postsDiv.querySelectorAll('li a');
            links.forEach((link) => {
              link.addEventListener('click', () => {
                watchedState.data.visitedLinks.push(link.dataset.postid);
              });
            });
          }
        });
      });
      const config = { attributes: true, childList: true, characterData: true };
      observer.observe(elements.postsDiv, config);
    })
    .catch((err) => {
      console.log('something went wrong loading', err);
    });
};
