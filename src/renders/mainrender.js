import _ from 'lodash';
import { changeLinkStyle } from '../utils.js';
import createFeedBlock from './renders-feeds.js';
import { createPostBlock, makeUpdatedRendering } from './renders-posts.js';
import callModal from './modal.js';

const addModal = (postsDiv, primary, secondary) => {
  const liButtons = postsDiv.querySelectorAll('.btn-sm');
  return liButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      callModal(btn, primary, secondary);
    });
  });
};

// eslint-disable-next-line
export default (state, elements, i18n) => (path) => {
  if (state.form.valid === false) {
    elements.dangerP.textContent = state.form.errors.yupError;
    elements.input.classList.add('error');
    elements.dangerP.classList.remove('text-success');
    elements.dangerP.classList.add('text-danger');
  }

  const visited = _.uniq(state.uiState.visitedLinks);
  if (state.request.state === 'processing') {
    elements.dangerP.textContent = '';
    elements.input.classList.remove('error');
    elements.input.setAttribute('disabled', '');
    elements.btn.setAttribute('disabled', '');
    changeLinkStyle(elements.postsDiv, visited);
  }
  if (state.request.state === 'waiting') {
    elements.input.removeAttribute('disabled');
    elements.btn.removeAttribute('disabled');
    elements.input.focus({ preventScroll: true });
    changeLinkStyle(elements.postsDiv, visited);
  }

  if (state.request.state === 'failed') {
    elements.dangerP.classList.remove('text-success');
    elements.dangerP.classList.add('text-danger');
    elements.dangerP.textContent = state.form.errors.invalidRss;
  }

  if (state.request.state === 'success'
       && state.request.requestEnd) {
    elements.input.classList.remove('error');
    elements.dangerP.classList.remove('text-danger');
    elements.dangerP.classList.add('text-success');
    elements.dangerP.textContent = i18n.t('valid');
    createFeedBlock(
      '.feeds',
      state.data.feeds,
      i18n.t('keyFeeds'),
    );
    createPostBlock(
      '.posts',
      state.data.posts,
      i18n.t('keyPosts'),
      i18n.t('btnPosts'),
    );

    addModal(elements.postsDiv, i18n.t('modal.primary'), i18n.t('modal.secondary'));
    changeLinkStyle(elements.postsDiv, visited);
  }

  if (state.updatedData.isUpdated) {
    makeUpdatedRendering(state.updatedData.updatedPosts, elements.postsDiv, i18n.t('btnPosts'));
    addModal(elements.postsDiv, i18n.t('modal.primary'), i18n.t('modal.secondary'));
    changeLinkStyle(elements.postsDiv, visited);
  }
};
