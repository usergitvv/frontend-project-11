import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import onChange from 'on-change';
import _ from 'lodash';
import ru from './locales/ru.js';
import parse from './parsers.js';
import { addProxy, getFeedId, changeLinkStyle } from './utils.js';
import { mainRender, addModal } from './renders/mainrender.js';
import { makeUpdatedRendering } from './renders/renders-posts.js';

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
        request: {
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
          feeds: null,
          posts: null,
          validLinks: [],
        },
        updatedData: {
          updatedPosts: undefined,
        },
        uiState: {
          visitedLinks: [],
        },
      };

      const makeValidation = (validlinks, inputvalue) => {
        const schema = yup.object({
          feedUrl: yup.string().url(i18nInst.t('errTexts.errUrl'))
            .notOneOf(
              validlinks,
              i18nInst.t('errTexts.errFeed'),
            )
            .required(i18nInst.t('errTexts.required')),
        });
        return schema.validate({ feedUrl: inputvalue });
      };

      const getNewsUpdate = (links) => {
        const urls = links.map((link) => addProxy(link))
          .map((url) => axios.get(url));

        return Promise.all(urls)
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
              link.addEventListener('click', (ev) => {
                state.uiState.visitedLinks.push(ev.target.dataset.postid);
                changeLinkStyle(elements.postsDiv, state.uiState.visitedLinks);
              });
            });
            state.updatedData.updatedPosts = updatedNews;
          })
          .then(() => {
            makeUpdatedRendering(state.updatedData.updatedPosts, elements.postsDiv, i18nInst.t('btnPosts'));
            addModal(elements.postsDiv, i18nInst.t('modal.primary'), i18nInst.t('modal.secondary'));
          })
          .catch((error) => {
            console.log(error);
          })
          .finally(() => {
            setTimeout(() => getNewsUpdate(links), 5000);
          });
      };

      const watchedState = onChange(state, mainRender(state, elements, i18nInst));

      elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputValue = e.target[0].value;
        watchedState.request.state = 'processing';

        makeValidation(watchedState.data.validLinks, inputValue)
          .then((request) => {
            watchedState.request.requestEnd = false;

            const reqUrl = addProxy(request.feedUrl);
            axios.get(reqUrl, { timeout: 12000 })
              .then((response) => {
                const data = parse(response);
                const { feed, posts } = data;
                const id = _.uniqueId('feed_');
                const { title } = feed;
                feed.id = id;
                watchedState.data.feeds = feed;
                watchedState.data.feedsId.push({ id, title });

                const postsWithId = posts.map((post) => {
                  post.feedId = id;
                  post.id = _.uniqueId('post_');
                  return post;
                });
                watchedState.form.valid = true;
                watchedState.form.errors.yupError = '';
                watchedState.data.posts = postsWithId;
                if (navigator.onLine) {
                  watchedState.data.validLinks.push(request.feedUrl);
                }
                watchedState.request.state = 'success';
              })
              .catch((err) => {
                if (err.message === 'Empty RSS') {
                  watchedState.form.valid = true;
                  watchedState.request.state = 'failed';
                  watchedState.form.errors.invalidRss = i18nInst.t('errTexts.invalid');
                } else {
                  watchedState.form.valid = true;
                  watchedState.request.state = 'failed';
                  watchedState.form.errors.invalidRss = i18nInst.t('errTexts.networkErr');
                }
              })
              .finally(() => {
                watchedState.request.requestEnd = true;
                watchedState.request.state = 'waiting';
                if (watchedState.data.feeds !== null) {
                  const links = elements.postsDiv.querySelectorAll('li a');
                  links.forEach((link) => {
                    link.addEventListener('click', (event) => {
                      watchedState.uiState.visitedLinks.push(event.target.dataset.postid);
                    });
                  });
                  getNewsUpdate(watchedState.data.validLinks);
                }
              });
          })
          .catch((err) => {
            watchedState.request.state = 'waiting';
            watchedState.form.valid = false;
            watchedState.form.errors.yupError = err.message;
          });
      });
    })
    .catch((err) => {
      console.log('something went wrong loading', err);
    });
};
