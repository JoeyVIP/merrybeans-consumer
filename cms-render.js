/**
 * CMS Render Engine — 從 cms-data.json 動態渲染網站內容
 * 用於 0 AI rebuild：後台改 CMS 資料 → git push → Render 自動部署
 */

(async function () {
  'use strict';

  let cmsData;
  try {
    const res = await fetch('cms-data.json');
    if (!res.ok) return; // 靜態 fallback — HTML 已有預設內容
    cmsData = await res.json();
  } catch {
    return; // fetch 失敗就用 HTML 預設內容
  }

  // ===== Helper =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function setText(sel, val) {
    const el = $(sel);
    if (el && val != null) el.textContent = val;
  }

  function setHTML(sel, val) {
    const el = $(sel);
    if (el && val != null) el.innerHTML = val;
  }

  function setAttr(sel, attr, val) {
    const el = $(sel);
    if (el && val && el.getAttribute(attr) !== val) el.setAttribute(attr, val);
  }

  // ===== SEO =====
  if (cmsData.seo) {
    const seo = cmsData.seo;
    if (seo.title) document.title = seo.title;
    const metaDesc = $('meta[name="description"]');
    if (metaDesc && seo.description) metaDesc.setAttribute('content', seo.description);
  }

  // ===== HERO =====
  if (cmsData.hero) {
    const hero = cmsData.hero;
    setText('.hero-badge', hero.badge);
    if (hero.headline || hero.headline_accent) {
      const h1 = $('.hero-title');
      if (h1) {
        h1.innerHTML = `${hero.headline || ''}<br><span class="accent">${hero.headline_accent || ''}</span>`;
      }
    }
    if (hero.subtitle) {
      const sub = $('.hero-subtitle');
      if (sub) sub.innerHTML = hero.subtitle.replace(/\n/g, '<br>');
    }
    if (hero.cta_text) setText('.hero-cta', hero.cta_text);
    if (hero.cta_link) setAttr('.hero-cta', 'href', hero.cta_link);
    if (hero.main_image) setAttr('.hero-image-main', 'src', hero.main_image);
    if (hero.float_product_1) setAttr('.hero-float-1', 'src', hero.float_product_1);
    if (hero.float_product_2) setAttr('.hero-float-2', 'src', hero.float_product_2);
  }

  // ===== PHILOSOPHY =====
  if (cmsData.brand) {
    if (cmsData.brand.slogan) setText('.philosophy-quote', cmsData.brand.slogan);
    if (cmsData.brand.slogan_en) setText('.philosophy-sub', cmsData.brand.slogan_en);
  }

  // ===== SIGNATURE PRODUCTS =====
  if (cmsData.signature) {
    const sig = cmsData.signature;
    setText('#products .section-label', sig.section_label);
    setText('#products .section-title', sig.section_title);
    setText('#products .section-desc', sig.section_desc);

    if (sig.items && sig.items.length > 0) {
      const grid = $('#products .products-grid');
      if (grid) {
        grid.innerHTML = sig.items.map(item => `
          <div class="product-card reveal">
            ${item.tag ? `<span class="product-card-tag">${item.tag}</span>` : ''}
            <div class="product-card-image">
              <img src="${item.image || ''}" alt="${item.name}" loading="lazy">
            </div>
            <div class="product-card-info">
              <h3 class="product-card-name">${item.name}</h3>
              <p class="product-card-desc">${item.description || ''}</p>
              <span class="product-card-price">${item.price || ''}</span>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // ===== FULL MENU =====
  if (cmsData.menu) {
    const menu = cmsData.menu;
    setText('#menu .section-label', menu.section_label);
    setText('#menu .section-title', menu.section_title);
    setText('#menu .section-desc', menu.section_desc);

    if (menu.categories && menu.categories.length > 0) {
      // 渲染分類按鈕
      const catContainer = $('#menuCats');
      if (catContainer) {
        catContainer.innerHTML = `
          <button class="menu-cat-btn active" data-cat="all">全部</button>
          ${menu.categories.map(cat =>
            `<button class="menu-cat-btn" data-cat="${cat.cat_id}">${cat.name}</button>`
          ).join('')}
        `;
      }

      // 渲染菜單品項
      const menuGrid = $('#menuGrid');
      if (menuGrid) {
        menuGrid.innerHTML = menu.categories.map(cat =>
          (cat.items || []).map(item => {
            const hotTag = item.is_hot && item.hot_tag
              ? ` <span class="hot-tag">${item.hot_tag}</span>` : '';
            const priceM = item.price_m
              ? `<span><span class="price-label">M </span><span class="price-value">${item.price_m}</span></span>` : '';
            const priceL = item.price_l
              ? `<span><span class="price-label">L </span><span class="price-value">${item.price_l}</span></span>` : '';
            return `<div class="menu-item" data-cat="${cat.cat_id}"><span class="menu-item-name">${item.name}${hotTag}</span><span class="menu-item-prices">${priceM}${priceL}</span></div>`;
          }).join('')
        ).join('');
      }

      // 重新綁定分類篩選
      document.querySelectorAll('.menu-cat-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.menu-cat-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          const cat = this.dataset.cat;
          document.querySelectorAll('.menu-item').forEach(item => {
            item.style.display = (cat === 'all' || item.dataset.cat === cat) ? '' : 'none';
          });
        });
      });
    }

    if (menu.menu_note) setText('.menu-note', menu.menu_note);
  }

  // ===== BRAND STORY =====
  if (cmsData.story) {
    const story = cmsData.story;
    setText('#story .section-label', story.section_label);
    setText('#story .section-title', story.section_title);
    setText('.story-content h3', story.headline);
    if (story.main_image) setAttr('.story-img-main', 'src', story.main_image);
    if (story.accent_image) setAttr('.story-img-accent', 'src', story.accent_image);

    if (story.paragraphs && story.paragraphs.length > 0) {
      const content = $('.story-content');
      if (content) {
        const h3 = content.querySelector('h3');
        const values = content.querySelector('.story-values');
        // 移除既有段落
        content.querySelectorAll('p').forEach(p => p.remove());
        // 插入新段落
        const frag = document.createDocumentFragment();
        story.paragraphs.forEach(p => {
          const el = document.createElement('p');
          el.className = 'reveal';
          el.textContent = p.text;
          frag.appendChild(el);
        });
        if (values) {
          content.insertBefore(frag, values);
        } else {
          content.appendChild(frag);
        }
      }
    }

    if (story.values && story.values.length > 0) {
      const valuesGrid = $('.story-values');
      if (valuesGrid) {
        // 保留 SVG icons 的順序
        const icons = [
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
        ];
        valuesGrid.innerHTML = story.values.map((v, i) => `
          <div class="story-value">
            <div class="story-value-icon">${icons[i % icons.length]}</div>
            <div class="story-value-text">
              <h4>${v.title}</h4>
              <p>${v.description || ''}</p>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // ===== STORE INFO =====
  if (cmsData.store) {
    const store = cmsData.store;
    setText('#store .section-label', store.section_label);
    setText('#store .section-title', store.section_title);
    setText('#store .section-desc', store.section_desc);
    if (store.store_image) setAttr('.store-image img', 'src', store.store_image);

    if (store.locations && store.locations.length > 0) {
      const loc = store.locations[0]; // 目前只有一家店
      setText('.store-info-card h3', loc.name);
      const details = document.querySelectorAll('.store-detail');
      if (details[0] && loc.address) details[0].querySelector('.store-detail-text p').textContent = loc.address;
      if (details[1] && loc.hours) details[1].querySelector('.store-detail-text p').textContent = loc.hours;
      if (details[2] && loc.phone) details[2].querySelector('.store-detail-text p').textContent = loc.phone;
      if (details[3] && loc.instagram) details[3].querySelector('.store-detail-text p').textContent = loc.instagram;
    }
  }

  // ===== RAFFLE =====
  if (cmsData.raffle) {
    const raffle = cmsData.raffle;
    setText('#raffle .section-label', raffle.section_label);
    setText('#raffle .section-title', raffle.section_title);
    setText('#raffle .section-desc', raffle.section_desc);

    if (raffle.steps && raffle.steps.length > 0) {
      const howSection = $('.raffle-how');
      if (howSection) {
        howSection.innerHTML = raffle.steps.map((step, i) => `
          <div class="raffle-step">
            <div class="raffle-step-num">${i + 1}</div>
            <h4>${step.title}</h4>
            <p>${step.description || ''}</p>
          </div>
        `).join('');
      }
    }

    // 即時名單：從 ig-raffle-service API 載入（有 api_endpoint 時）
    if (raffle.api_endpoint) {
      const listContainer = $('.raffle-list');
      if (listContainer) {
        try {
          const apiBase = raffle.api_endpoint.replace(/\/$/, '');
          const resp = await fetch(`${apiBase}/api/public/entries?limit=20`);
          if (resp.ok) {
            const data = await resp.json();
            if (data.entries && data.entries.length > 0) {
              listContainer.innerHTML = data.entries.map(e => {
                const name = e.displayName || '***';
                const avatar = name.charAt(0).toUpperCase();
                const time = e.createdAt
                  ? new Date(e.createdAt * 1000).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : '';
                return `<div class="raffle-entry">
                  <div class="raffle-entry-user">
                    <div class="raffle-entry-avatar">${avatar}</div>
                    <div>
                      <div class="raffle-entry-name">${name}</div>
                      <div class="raffle-entry-time">${time}</div>
                    </div>
                  </div>
                  <span class="raffle-entry-status">已參加</span>
                </div>`;
              }).join('');

              // 更新總人數
              const countEl = $('.raffle-count');
              if (countEl) countEl.textContent = `${data.total} 人參加`;
            }
          }
        } catch {
          // API 不可用時保留靜態假資料
        }
      }

      // 暴露 CMS 資料供外部模組使用
      window.__CMS_DATA = cmsData;
    }
  }

  // ===== FOOTER =====
  if (cmsData.footer) {
    const footer = cmsData.footer;
    const brandP = $('.footer-brand p');
    if (brandP && footer.tagline) brandP.innerHTML = footer.tagline.replace(/\n/g, '<br>');
    if (footer.copyright) setText('.footer-bottom span', footer.copyright);
  }

  // ===== GALLERY =====
  if (cmsData.gallery && cmsData.gallery.images) {
    const track = $('#galleryTrack');
    if (track) {
      const imgs = cmsData.gallery.images;
      // 渲染兩組（無縫循環），含 width/height 防止 CLS
      const html = imgs.map(img =>
        `<img src="${img.src}" alt="${img.alt || ''}" loading="lazy" width="300" height="200">`
      ).join('');
      track.innerHTML = html + html;
    }
  }

  // ===== 通知 GSAP 重新綁定動畫 =====
  // cms-render.js 是 async（fetch），執行完後 GSAP 可能已綁定舊元素
  // 發送自訂事件讓後續腳本知道 CMS 渲染完成
  // Expose CMS data for other scripts (e.g. raffle integration)
  window.__CMS_DATA = cmsData;
  window.dispatchEvent(new CustomEvent('cms-rendered'));

})();
