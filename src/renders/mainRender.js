import _ from 'lodash';
import { changeLinkStyle } from '../utils.js';
import createFeedBlock from './rendersFeeds.js';
import { createPostBlock, makeUpdatedRendering } from './rendersPosts.js';
import callModal from './modal.js';

const addModal = (postsDiv, primary, secondary) => {
  const liButtons = postsDiv.querySelectorAll('.btn-sm');
  return liButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      callModal(btn, primary, secondary);
    });
  });
};

export default (state, elements, i18n) => (path) => {
  if (state.form.valid === false) {
    elements.dangerP.textContent = state.form.errors.yupError;
    elements.input.classList.add('error');
    elements.dangerP.classList.remove('text-success');
    elements.dangerP.classList.add('text-danger');
  }

  if (state.request.state === 'processing') {
    elements.dangerP.textContent = '';
    elements.input.classList.remove('error');
    elements.input.setAttribute('disabled', '');
    elements.btn.setAttribute('disabled', '');
  }

  if (state.request.state === 'waiting') {
    elements.input.removeAttribute('disabled');
    elements.btn.removeAttribute('disabled');
    elements.input.focus({ preventScroll: true });
  }

  if (state.request.state === 'failed') {
    elements.dangerP.classList.remove('text-success');
    elements.dangerP.classList.add('text-danger');
    elements.dangerP.textContent = state.form.errors.invalidRss;
  }

  const visited = _.uniq(state.uiState.visitedLinks);
  if (state.request.state === 'finished') {
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

  if (state.data.updatedPosts) {
    makeUpdatedRendering(state.data.updatedPosts, elements.postsDiv, i18n.t('btnPosts'));
    addModal(elements.postsDiv, i18n.t('modal.primary'), i18n.t('modal.secondary'));
    changeLinkStyle(elements.postsDiv, visited);
  }
};
