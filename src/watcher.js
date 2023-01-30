import onChange from 'on-change';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import { createPostBlock, makeUpdatedRendering } from './renders/renders-posts.js';
import createFeedBlock from './renders/renders-feeds.js';
import { makeParsingForAxios } from './parsers.js';
import ru from './locales/ru.js';
import callModal from './renders/modal.js';

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
    createFeedBlock(state.errOfRepeat, '.feeds', state.responseFeeds, state.feedsId);
    createPostBlock(state.errOfRepeat, '.posts', state.responsePosts);
    state.startBuilding = false;
    state.final = false;

    const uniq = _.uniq(state.trueLinks);
    const getNewsUpdate = (links) => {
      const billet = links.map((link) => `https://allorigins.hexlet.app/get?disableCache=true&url=${link}`);
      const urls = billet.map((detail) => axios(detail).then((response) => response.data.contents));
      Promise.all(urls)
        .then((data) => {
          data.forEach((item) => {
            if (makeParsingForAxios(item, state.feedsId) === false) {
              throw new Error('No data');
            }
            const info = makeParsingForAxios(item, state.feedsId);
            const [posts] = info;
            makeUpdatedRendering(posts, elements.postsDiv);
          });
        })
        .then(() => {
          const liButtons = elements.postsDiv.querySelectorAll('.btn-sm');
          liButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
              callModal(btn);
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
        callModal(btn);
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

export default watchedState;
