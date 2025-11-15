// script.js — full replacement (copy-paste this file)

const pageList = document.getElementById('page-list');
const newPageBtn = document.getElementById('new-page');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const fontFamily = document.getElementById('font-family');
const fontSize = document.getElementById('font-size');

const sidebar = document.querySelector('.sidebar');
const hideSidebarBtn = document.getElementById('hide-sidebar');
const showSidebarBtn = document.getElementById('show-sidebar');

let pages = JSON.parse(localStorage.getItem('notesTabPages')) || [];
let activePage = null;

/* ------------------------------
   Pages / Notes core functions
   ------------------------------ */
function loadPages() {
  pageList.innerHTML = '';
  pages.forEach((p, i) => {
  const li = document.createElement('li');
  li.className = activePage === i ? 'active' : '';
  li.style.display = 'flex';
  li.style.alignItems = 'center';
  li.style.justifyContent = 'space-between';

  // title span
  const titleSpan = document.createElement('span');
  titleSpan.textContent = p.title || `Page ${i + 1}`;
  titleSpan.style.flex = '1';
  titleSpan.onclick = () => switchPage(i);

  // simple X delete button
  const delBtn = document.createElement('button');
  delBtn.textContent = '✕'; // simple X
  delBtn.title = 'Delete this note';
  delBtn.style.border = 'none';
  delBtn.style.background = 'transparent';
  delBtn.style.color = '#888';
  delBtn.style.cursor = 'pointer';
  delBtn.style.fontSize = '1rem';
  delBtn.style.marginLeft = '8px';
  delBtn.style.transition = 'color 0.2s ease';
  delBtn.onmouseenter = () => (delBtn.style.color = '#000');
  delBtn.onmouseleave = () => (delBtn.style.color = '#888');
  delBtn.onclick = (e) => {
    e.stopPropagation(); // prevent page switching
    pages.splice(i, 1);
    if (activePage >= i) activePage = Math.max(0, activePage - 1);
    savePages();
    loadPages();
    if (pages.length) switchPage(activePage);
    else {
      noteTitle.value = '';
      noteContent.innerHTML = '';
    }
  };

  li.appendChild(titleSpan);
  li.appendChild(delBtn);
  pageList.appendChild(li);
});


  
  // redraw lucide icons if present inside page list/new page etc.
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }

}

function switchPage(i) {
  activePage = i;
  localStorage.setItem("notesTabActivePage", i);

  const p = pages[i];
  noteTitle.value = p.title;
  noteContent.innerHTML = p.content;
  loadPages();

  // Add short delay to trigger CSS animation again
setTimeout(() => {
  const activeItem = pageList.children[i];
  if (activeItem) {
    activeItem.classList.add("active");
  }
}, 10);
}

newPageBtn.onclick = () => {
  // Prevent duplicate untitled notes
  const baseTitle = "Untitled";
  let title = baseTitle;
  let counter = 1;

  while (pages.some(p => p.title === title)) {
    title = `${baseTitle} ${counter++}`;
  }

  pages.push({ title, content: '' });

  // Auto-select the newest page
  activePage = pages.length - 1;
  savePages();
  loadPages();
  switchPage(activePage);
};


function savePages() {
  localStorage.setItem('notesTabPages', JSON.stringify(pages));
}

noteTitle.oninput = noteContent.oninput = () => {
  if (activePage !== null) {
    let newTitle = noteTitle.value.trim();
    if (newTitle === "") newTitle = "Untitled";
    pages[activePage].title = newTitle;

    pages[activePage].content = noteContent.innerHTML;
    savePages();
    loadPages();
  }
};

/* ------------------------------
   Formatting tools
   ------------------------------ */
function format(cmd) {
  document.execCommand(cmd, false, null);
}

if (fontFamily) {
  fontFamily.onchange = () => {
    document.execCommand('fontName', false, fontFamily.value);
  };
}

if (fontSize) {
  fontSize.onchange = () => {
    // old execCommand fontSize uses 1-7, so we use 7 then scale via CSS
    document.execCommand('fontSize', false, '7');
    document.querySelectorAll('font[size="7"]').forEach(f => f.removeAttribute('size'));
    noteContent.style.fontSize = `${fontSize.value}px`;
  };
}

function insertLink() {
  const url = prompt("Enter URL (include https:// or http://):");
  if (url) document.execCommand("createLink", false, url);
}

/* ------------------------------
   Sidebar toggle logic (robust)
   ------------------------------ */

/*
  Behavior:
  - Desktop (width > 768): sidebar shown by default. "Hide" sets display:none, Show restores display:flex.
  - Mobile  (width <= 768): sidebar uses .show class to slide in/out (CSS transform). show-sidebar button is visible.
  - Window resize sync ensures the UI never gets stuck.
*/

function isMobileWidth() {
  return window.innerWidth <= 768;
}

function updateSidebarOnResize() {
  // If mobile: ensure sidebar is off-screen by default unless it has .show
  if (isMobileWidth()) {
    // allow transform-based mobile show/hide; ensure show button visible
    sidebar.style.display = ''; // let CSS handle positioning
    showSidebarBtn.style.display = 'inline-flex';
    // if sidebar was hidden via desktop hide (display:none), remove that so mobile can use .show
    if (sidebar.style.display === 'none') {
      sidebar.style.display = '';
    }
  } else {
    // Desktop: sidebar should be visible (unless user previously closed it with desktop hide)
    // If user had used desktop-hide (we stored state using dataset), honor that
    const desktopHidden = sidebar.dataset.desktopHidden === 'true';
    if (desktopHidden) {
      sidebar.style.display = 'none';
      showSidebarBtn.style.display = 'inline-flex';
    } else {
      sidebar.style.display = 'flex';
      showSidebarBtn.style.display = 'none';
      // remove mobile show class to avoid transform issues
      sidebar.classList.remove('show');
    }
  }
}

// hide button (inside sidebar header)
if (hideSidebarBtn) {
  hideSidebarBtn.addEventListener('click', () => {
    if (isMobileWidth()) {
      // mobile: slide out (remove .show)
      sidebar.classList.remove('show');
    } else {
      // desktop: hide with display none and remember that user hid it
      sidebar.style.display = 'none';
      sidebar.dataset.desktopHidden = 'true';
      showSidebarBtn.style.display = 'inline-flex';
    }
  });
}

// show button (in topbar)
if (showSidebarBtn) {
  showSidebarBtn.addEventListener('click', () => {
    if (isMobileWidth()) {
      // mobile: slide in
      sidebar.classList.add('show');
    } else {
      // desktop: show sidebar again and clear hidden flag
      sidebar.style.display = 'flex';
      sidebar.dataset.desktopHidden = 'false';
      showSidebarBtn.style.display = 'none';
    }
  });
}

// When user resizes the window, update sidebar state so it never gets stuck
window.addEventListener('resize', () => {
  updateSidebarOnResize();
});

// If user presses Escape on mobile while sidebar is visible, close it
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMobileWidth() && sidebar.classList.contains('show')) {
    sidebar.classList.remove('show');
  }
});

/* ------------------------------
   Close sidebar on outside click (mobile only)
   ------------------------------ */
document.addEventListener('click', (e) => {
  if (!isMobileWidth()) return; // only mobile
  if (!sidebar.classList.contains('show')) return; // only when sidebar is open

  const clickInsideSidebar = sidebar.contains(e.target);
  const clickedShowButton = showSidebarBtn.contains(e.target);

  // If clicked outside both sidebar and the "open" button → close it
  if (!clickInsideSidebar && !clickedShowButton) {
    sidebar.classList.remove('show');
  }
});


/* ------------------------------
   Initialization
   ------------------------------ */
function init() {
  // initial pages load
  loadPages();
  if (pages.length) {
  const savedIndex = parseInt(localStorage.getItem("notesTabActivePage"));
  if (!isNaN(savedIndex) && savedIndex < pages.length) {
    activePage = savedIndex;
    switchPage(savedIndex);
  } else {
    activePage = 0;
    switchPage(0);
  }
}


  // initial sidebar state
  // ensure showSidebarBtn exists (fail-safe)
  if (showSidebarBtn) {
    // On desktop, if the sidebar had been hidden earlier (persisted in dataset), reflect that.
    if (!isMobileWidth()) {
      // If it's the first load and dataset not set, default to visible
      if (sidebar.dataset.desktopHidden !== 'true') {
        sidebar.dataset.desktopHidden = 'false';
      }
    } else {
      // mobile: hide sidebar by default
      sidebar.classList.remove('show');
    }
  }

  // run the resize sync once
  updateSidebarOnResize();

  // lucide icons
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

// run init after tiny delay to ensure DOM + CSS loaded
document.addEventListener('DOMContentLoaded', init);


/* ---------------------------------------
   🧩 Make inserted links copyable on click
   --------------------------------------- */
noteContent.addEventListener('click', async (e) => {
  const target = e.target;
  if (target.tagName === 'A') {
    e.preventDefault();
    const url = target.getAttribute('href');
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        showToast(`🔗 Link copied!`);
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    }
  }
});

/* ---------------------------------------
   🔔 Simple toast notification system
   --------------------------------------- */
function showToast(message) {
  // Create toast container if it doesn't exist
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = 'show';

  // Hide after 2 seconds
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 2000);
}
