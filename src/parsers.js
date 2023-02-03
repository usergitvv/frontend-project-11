export default (response) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.data.contents, 'text/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    if (response.data.contents === null) {
      throw new Error('Error null');
    }
    throw new Error('Empty RSS');
  }
  const feed = [];
  const posts = [];
  const titleFeed = doc.querySelector('channel title');
  const feedDescription = doc.querySelector('description');

  feed.push({
    title: titleFeed.textContent,
    description: feedDescription.textContent,
  });

  const items = doc.querySelectorAll('item');
  items.forEach((item) => {
    const titlePost = item.querySelector('title');
    const link = item.querySelector('link');
    const postDescription = item.querySelector('description');
    posts.push({
      title: titlePost.textContent,
      description: postDescription.textContent,
      link: link.textContent,
    });
  });
  return [feed, posts, response.status, titleFeed.textContent];
};
