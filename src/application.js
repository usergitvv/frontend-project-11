import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import watchedState from './watcher.js';
import ru from './locales/ru.js';
import makeParsing from './parsers.js';

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

export default () => {
  // eslint-disable-next-line
  const regexp = /https?:\/\/[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
  const input = document.getElementById('url-input');
  const form = document.querySelector('form');
  const values = [];
  const postsDiv = document.querySelector('.posts');

  form.addEventListener('submit', (e) => {
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

    const inputValue = input.value;
    const schema = yup.object({
      feedUrl: yup.string().trim()
        .matches(regexp, i18nInst.t('errTexts.errUrl'))
        .notOneOf(
          values,
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

    function addUrlToValues(arrValues, url, type) {
      if (navigator.onLine) {
        if (type === 'empty') return false;
        arrValues.push(url);
      }
      return false;
    }

    const routes = {
      rssPath: () => `https://allorigins.hexlet.app/get?disableCache=true&url=${inputValue.trim()}`,
    };
    axios.get(routes.rssPath(), { timeout: 12000 })
      .then((response) => {
        let contentType;
        if (makeParsing(response) === false) {
          watchedState.responseFeeds = null;
          watchedState.responsePosts = null;
        }
        if (makeParsing(response) === 'emptyRSS') {
          watchedState.emptyRSS = true;
          contentType = 'empty';
        } else {
          const data = makeParsing(response);
          const [feed, posts, status] = data;
          watchedState.responseFeeds = feed;
          watchedState.responsePosts = posts;
          const trueUrl = inputValue.trim();
          watchedState.trueLinks.push(trueUrl);

          watchedState.startBuilding = true;
          watchedState.responseStatus = status;
          addUrlToValues(values, inputValue, contentType);
        }
      })
      .catch((err) => {
        console.log(err);
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
  observer.observe(postsDiv, config);
};
