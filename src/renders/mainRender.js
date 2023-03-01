import _ from 'lodash';
import { changeLinkStyle } from '../utils.js';
import createFeeds from './rendersFeeds.js';
import { createPosts, makeUpdatedRendering } from './rendersPosts.js';
import callModal from './modal.js';

const addModal = (postsDiv, primary, secondary) => {
  const liButtons = postsDiv.querySelectorAll('.btn-sm');
  return liButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      callModal(btn, primary, secondary);
    });
  });
};

export default (state, elements, i18n) => (path, value) => {
  switch (path) {
    case 'form.status':
      if (!value.valid) {
        elements.dangerP.textContent = value.yupError;
        elements.input.classList.add('error');
        elements.dangerP.classList.remove('text-success');
        elements.dangerP.classList.add('text-danger');
      }
      break;
    case 'request.state':
      if (value === 'processing') {
        elements.dangerP.textContent = '';
        elements.input.classList.remove('error');
        elements.input.setAttribute('disabled', '');
        elements.btn.setAttribute('disabled', '');
      }
      if (value === 'waiting') {
        elements.input.removeAttribute('disabled');
        elements.btn.removeAttribute('disabled');
      }
      if (value.state === 'failed') {
        elements.input.classList.remove('error');
        elements.dangerP.classList.remove('text-success');
        elements.dangerP.classList.add('text-danger');
        elements.dangerP.textContent = value.error;
        elements.input.removeAttribute('disabled');
        elements.btn.removeAttribute('disabled');
        elements.input.focus({ preventScroll: true });
      }
      if (value === 'finished') {
        elements.input.classList.remove('error');
        elements.dangerP.classList.remove('text-danger');
        elements.dangerP.classList.add('text-success');
        elements.dangerP.textContent = i18n.t('valid');
        createFeeds(
          '.feeds',
          state.data.feeds,
          i18n.t('keyFeeds'),
        );
        createPosts(
          '.posts',
          state.data.posts,
          i18n.t('keyPosts'),
          i18n.t('btnPosts'),
        );

        addModal(elements.postsDiv, i18n.t('modal.primary'), i18n.t('modal.secondary'));
        elements.input.removeAttribute('disabled');
        elements.btn.removeAttribute('disabled');
        elements.input.focus({ preventScroll: true });
      }
      break;
    case 'uiState.visitedLinks':
      changeLinkStyle(elements.postsDiv, _.uniq(value));
      break;
    case 'data.updatedPosts':
      if (value) {
        makeUpdatedRendering(state.data.updatedPosts, elements.postsDiv, i18n.t('btnPosts'));
        addModal(elements.postsDiv, i18n.t('modal.primary'), i18n.t('modal.secondary'));
      }
      break;
    default:
      break;
  }
};
