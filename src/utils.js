const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const getFeedId = (feeds, feedTitle) => {
  const idOfFeed = feeds.find((obj) => obj.title === feedTitle);
  return idOfFeed.id;
};

const changeLinkStyle = (postsDiv, visited) => {
  const links = postsDiv.querySelectorAll('li a');
  const linksArr = Array.from(links);
  const visitedLinks = linksArr.filter((link) => visited.includes(link.dataset.postid));
  return visitedLinks.forEach((visLink) => {
    visLink.classList.remove('fw-bold');
    visLink.classList.add('fw-normal');
    visLink.classList.add('visited');
  });
};

export {
  addProxy,
  getFeedId,
  changeLinkStyle,
};
