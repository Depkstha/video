const videoContainer = document.querySelector(".video-grid");
const searchInput = document.getElementById("searchInput");

function daysAgo(timestamp) {
  const givenDate = new Date(timestamp);
  const today = new Date();
  const diffTime = today - givenDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} days ago`;
}

function viewsCountInK(viewsCount) {
  const formatted = (viewsCount / 1000).toFixed(2);
  return `${formatted}K views`;
}

function convertToTime(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const generateVideoURL = (videoId) => {
  const YOUTUBE_URL = new URL("https://www.youtube.com/watch");
  const params = new URLSearchParams(YOUTUBE_URL);
  params.append("search", videoId);
  YOUTUBE_URL.search = params.toString();
  return YOUTUBE_URL.toString();
};

const cacheVideos = (videos) => {
  localStorage.setItem("cachedVideos", JSON.stringify(videos));
};

const getCachedVideos = () => {
  const cached = localStorage.getItem("cachedVideos");
  return cached ? JSON.parse(cached) : null;
};

const getVideos = async (page, limit) => {
  const url = `https://api.freeapi.app/api/v1/public/youtube/videos?page=${page}&limit=${limit}&query=javascript&sortBy=latest`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    return (await response.json()).data;
  } catch (error) {
    console.error("Fetch error:", error.message);
    return null;
  }
};

const renderVideos = async (page = 1, limit = 200) => {
  const apiData = await getVideos(page, limit);
  if (!apiData) return;
  videosData = apiData.data;
  cacheVideos(videosData);

  videoContainer.innerHTML = generateVideoHTML(videosData);
};

function debounce(func, timeout = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const searchVideos = (searchTerm) => {
  const videosData = getCachedVideos();
  if (!videosData) return;

  const filtered = videosData.filter((video) =>
    video.items.snippet.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  videoContainer.innerHTML =
    filtered.length > 0
      ? generateVideoHTML(filtered)
      : `<div class="no-results">No videos found matching "${searchTerm}"</div>`;
};

const debouncedSearch = debounce(searchVideos, 500);

const generateVideoHTML = (videos) => {
  return videos
    .map(
      ({
        items: {
          id,
          snippet: { publishedAt, title, thumbnails, channelTitle },
          contentDetails: { duration },
          statistics: { viewCount },
        },
      }) => `
    <div class="video-card">
      <a target="_blank" href="${generateVideoURL(id)}">
      <div class="thumbnail">
        <img src="${thumbnails.standard.url}" alt="${title}" />
        <span class="duration">${convertToTime(duration)}</span>
      </div>
      <div class="video-info">
        <div class="video-details">
          <p class="video-title">${title}</p>
          <p class="channel-name">${channelTitle}</p>
          <p class="video-stats">${viewsCountInK(viewCount)} • ${daysAgo(
        publishedAt
      )}</p>
        </div>
      </div>
      </a>
    </div>
  `
    )
    .join("");
};

searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.trim();
  if (!searchTerm) {
    return;
  }
  debouncedSearch(searchTerm);
});

renderVideos();
