/* eslint-disable camelcase */
import { isPlainObject, uniqueId } from 'lodash';

export default (response) => {
  if (!isPlainObject(response)) return false;
  if (response.data.contents === null) return false;
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.data.contents, 'text/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    return 'emptyRSS';
  }
  const channel = doc.querySelector('channel');
  if (channel) {
    const { url } = response.data.status;
    const feed = [];
    const posts = [];
    const titleF = doc.querySelector('channel title');
    const description = doc.querySelector('description');
    const idF = uniqueId('feed_');
    feed.push({
      id: idF,
      title: titleF.textContent,
      description: description.textContent,
    });

    const items = doc.querySelectorAll('item');
    items.forEach((item) => {
      const titleP = item.querySelector('title');
      const link = item.querySelector('link');
      const postDescription = item.querySelector('description');
      const idP = uniqueId('post_');
      posts.push({
        idFeed: idF,
        id: idP,
        title: titleP.textContent,
        description: postDescription.textContent,
        link: link.textContent,
      });
    });
    return [feed, posts, url, response.status];
  }
  return false;
};

const getFeedId = (feedsId, channel) => {
  if (feedsId.length === 0) return false;
  let idFeed;
  feedsId.forEach((obj) => {
    const { title, id } = obj;
    if (title === channel) idFeed = id;
    return null;
  });
  return idFeed;
};

const makeParsingForAxios = (response, feedsId) => {
  if (feedsId.length === 0) return false;
  const parser = new DOMParser();
  const doc = parser.parseFromString(response, 'text/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    return false;
  }

  const channel = doc.querySelector('channel');
  if (channel) {
    const posts = [];
    const titleFeed = doc.querySelector('channel title');
    const items = doc.querySelectorAll('item');
    items.forEach((item) => {
      if (item === null) return false;
      const titlePost = item.querySelector('title');
      const link = item.querySelector('link');
      const postDescription = item.querySelector('description');
      const idP = uniqueId('post_');
      const feedId = getFeedId(feedsId, titleFeed.textContent);
      posts.push({
        idFeed: feedId,
        id: idP,
        title: titlePost.textContent,
        description: postDescription.textContent,
        link: link.textContent,
      });
      return null;
    });
    return [posts];
  }
  return false;
};

export {
  makeParsingForAxios,
};
