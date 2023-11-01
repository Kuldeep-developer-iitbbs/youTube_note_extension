(() => {
  let youtubeLeftControls, youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: "",
    };
  
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter description";

    input.addEventListener("keydown", async (event) => {
      if (event.key === " ") {
        event.preventDefault();
      } else if (event.key === "Enter") {
        const description = input.value;
        newBookmark.desc = description
          ? `${description}`
          : `Bookmark at ${getTime(currentTime)}`;
    
        currentVideoBookmarks = await fetchBookmarks();
    
        chrome.storage.sync.set({
          [currentVideo]: JSON.stringify(
            [...currentVideoBookmarks, newBookmark].sort(
              (a, b) => a.time - b.time
            )
          ),
        });
        youtubeLeftControls.removeChild(input);
        youtubeLeftControls.removeChild(saveButton);
      }else {
        event.stopPropagation();
      }
    });
    
  
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
  
    youtubeLeftControls.appendChild(input);
    youtubeLeftControls.appendChild(saveButton);
  
    input.focus();

    saveButton.addEventListener("click", async () => {
      const description = input.value;
      newBookmark.desc = description
        ? `${description}`
        : `Bookmark at ${getTime(currentTime)}`;
  
      currentVideoBookmarks = await fetchBookmarks();
  
      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify(
          [...currentVideoBookmarks, newBookmark].sort(
            (a, b) => a.time - b.time
          )
        ),
      });
      youtubeLeftControls.removeChild(input);
      youtubeLeftControls.removeChild(saveButton);
    });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists =
      document.getElementsByClassName("bookmark-btn")[0];

    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";
      bookmarkBtn.title = "Click to bookmark current timestamp";

      youtubeLeftControls =
        document.getElementsByClassName("ytp-left-controls")[0];
      youtubePlayer = document.getElementsByClassName("video-stream")[0];

      youtubeLeftControls.appendChild(bookmarkBtn);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {
      youtubePlayer.currentTime = value;
    } else if (type === "DELETE") {
      currentVideoBookmarks = currentVideoBookmarks.filter(
        (b) => b.time != value
      );
      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify(currentVideoBookmarks),
      });

      response(currentVideoBookmarks);
    }
  });

  newVideoLoaded();
})();

const getTime = (t) => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};
