/* ═══════════════════════════════════════════════════════
   ARCHWY — JavaScript (Design Experiment / V2)
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Scroll: header styling ── */
  const header = document.querySelector('.header');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Auto-play muted background videos (replaces HTML autoplay attr) ── */
  document.querySelectorAll('video[muted]').forEach(v => { v.play().catch(() => {}); });

  /* ── Mobile nav toggle ── */
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    const nextState = !expanded;
    toggle.setAttribute('aria-expanded', String(nextState));
    navLinks.classList.toggle('open', nextState);
    header.classList.toggle('nav-open', nextState);
    document.body.style.overflow = nextState ? 'hidden' : '';
  });

  // Close nav when a link is clicked
  navLinks.querySelectorAll('.nav-link, .nav-mobile-cta').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      header.classList.remove('nav-open');
      document.body.style.overflow = '';
    });
  });

  /* ── Active nav link on scroll ── */
  const sections = document.querySelectorAll('[id]');
  const navItems = document.querySelectorAll('.nav-link[data-section]');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === id || (id === 'home' && item.dataset.section === 'home'));
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );
  sections.forEach(s => sectionObserver.observe(s));

  /* ── Scroll animations ── */
  const animatedEls = document.querySelectorAll('[data-animate]');
  const animObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          const delay = el.dataset.delay ? parseInt(el.dataset.delay, 10) : 0;
          if (el._animTimeout) clearTimeout(el._animTimeout);
          el._animTimeout = setTimeout(() => {
            el.classList.add('is-visible');
            animObserver.unobserve(el); // Animate once and stay visible permanently
            delete el._animTimeout;
          }, delay);
        } else {
          if (el._animTimeout) {
            clearTimeout(el._animTimeout);
            delete el._animTimeout;
          }
        }
      });
    },
    { threshold: 0.05 } // Triggers slightly earlier for smoother scrolling dynamics
  );
  animatedEls.forEach(el => animObserver.observe(el));

  /* ── Redesigned Waitlist Form & Wizard Logic ── */
  const form = document.getElementById('waitlistForm');
  const submitBtn = document.getElementById('waitlistSubmitBtn');

  if (form) {
    const steps = Array.from(form.querySelectorAll('.form-step'));
    let currentStep = 0;
    let uploadedFiles = []; // Stores file objects for submission

    const fileInput = document.getElementById('fileInput');
    const photoUploadZone = document.getElementById('photoUploadZone');
    const photoPreviewGrid = document.getElementById('photoPreviewGrid');

    // Drag-and-drop / File upload logic
    if (photoUploadZone && fileInput && photoPreviewGrid) {
      photoUploadZone.addEventListener('click', () => fileInput.click());

      ['dragenter', 'dragover'].forEach(eventName => {
        photoUploadZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          photoUploadZone.classList.add('dragover');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        photoUploadZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          photoUploadZone.classList.remove('dragover');
        }, false);
      });

      photoUploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
      });

      fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
      });

      function handleFiles(files) {
        const maxFiles = 5;
        const fileList = Array.from(files).filter(file => file.type.startsWith('image/'));

        if (uploadedFiles.length + fileList.length > maxFiles) {
          alert('You can upload a maximum of 5 photos.');
          return;
        }

        fileList.forEach(file => {
          if (file.size > 5 * 1024 * 1024) {
            alert(`File "${file.name}" exceeds the 5MB limit.`);
            return;
          }

          uploadedFiles.push(file);

          const reader = new FileReader();
          reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview-item';
            previewItem.innerHTML = `
              <img src="${e.target.result}" alt="${file.name}" />
              <button type="button" class="remove-btn">&times;</button>
            `;

            previewItem.querySelector('.remove-btn').addEventListener('click', (ev) => {
              ev.stopPropagation();
              const idx = uploadedFiles.indexOf(file);
              if (idx > -1) uploadedFiles.splice(idx, 1);
              previewItem.remove();
            });

            photoPreviewGrid.appendChild(previewItem);
          };
          reader.readAsDataURL(file);
        });
      }
    }

    function showError(input, msg) {
      input.classList.add('error');
      let container = input.closest('.form-group') || input.parentElement;
      let err = container.querySelector('.form-error');
      if (err) err.textContent = msg;
    }

    function clearError(input) {
      input.classList.remove('error');
      let container = input.closest('.form-group') || input.parentElement;
      let err = container.querySelector('.form-error');
      if (err) err.textContent = '';
    }

    form.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('input', () => {
        if (input.value.trim()) clearError(input);
      });
    });

    function validateStep(stepIndex) {
      const step = steps[stepIndex];
      let valid = true;

      // Validate text inputs
      const textInputs = step.querySelectorAll('.form-input[required]');
      textInputs.forEach(input => {
        if (!input.value.trim()) {
          showError(input, 'This field is required.');
          valid = false;
        } else if (input.type === 'email') {
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(input.value.trim())) {
            showError(input, 'Please enter a valid email address.');
            valid = false;
          }
        }
      });

      // Winchester Postcode Check (Option A)
      if (stepIndex === 0 && valid) {
        const postcodeVal = form.querySelector('[name="postcode"]').value.trim().toUpperCase().replace(/\s+/g, '');
        const isWinchester = /^SO2[1-4]/.test(postcodeVal);

        let infoBox = form.querySelector('.expansion-notice');
        if (!isWinchester) {
          if (!infoBox) {
            infoBox = document.createElement('div');
            infoBox.className = 'expansion-notice';
            infoBox.style.cssText = 'background:#FFF8E1; border-left:4px solid #FFB300; padding:16px; margin-bottom:20px; font-size:0.9rem; border-radius:8px; color:#5D4037; font-family:"Inter",sans-serif; text-align:left; line-height:1.5; display:flex; align-items:flex-start; gap:12px;';
            form.prepend(infoBox);
          }
          infoBox.innerHTML = `
            <svg style="width:20px; height:20px; fill:#FFB300; flex-shrink:0; margin-top:2px;" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div>
              <strong>Area Notice:</strong> We do not service postcode <strong>${postcodeVal}</strong> just yet, but we are expanding soon! Register below to join our expansion list and claim your pre-launch voucher.
            </div>
          `;
        } else {
          if (infoBox) infoBox.remove();
        }
      }

      return valid;
    }

    function showStep(index) {
      steps.forEach((step, idx) => {
        if (idx === index) {
          step.style.display = 'block';
        } else {
          step.style.display = 'none';
        }
      });
      currentStep = index;

      // Scroll to top of the form
      const formTop = form.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: formTop, behavior: 'smooth' });
    }

    // Next buttons
    form.querySelectorAll('.btn-next').forEach(btn => {
      btn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
          // Send GA Funnel events
          if (typeof gtag === 'function') {
            if (currentStep === 0) {
              gtag('event', 'step_1_complete', { 'event_category': 'funnel' });
            }
          }
          showStep(currentStep + 1);
        }
      });
    });

    // Prev buttons
    form.querySelectorAll('.btn-prev').forEach(btn => {
      btn.addEventListener('click', () => {
        showStep(currentStep - 1);
      });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isValid = validateStep(currentStep);
      if (!isValid) return;

      submitBtn.textContent = 'Submitting…';
      submitBtn.disabled = true;

      // Asynchronously base64 encode any uploaded files
      const base64Files = await Promise.all(
        uploadedFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              resolve({
                name: file.name,
                type: file.type,
                base64: ev.target.result.split(',')[1]
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      // Collect all redesigned form data
      const payload = {
        first_name: (form.querySelector('[name="first_name"]') || {}).value || '',
        last_name: (form.querySelector('[name="last_name"]') || {}).value || '',
        email: (form.querySelector('[name="email"]') || {}).value || '',
        phone: (form.querySelector('[name="phone"]') || {}).value || '',
        postcode: (form.querySelector('[name="postcode"]') || {}).value || '',
        location: (form.querySelector('[name="location"]') || {}).value || '',
        job_start: (form.querySelector('[name="job_start"]') || {}).value || '',
        job_stage: (form.querySelector('[name="job_stage"]') || {}).value || '',
        notes: (form.querySelector('[name="q_extra"]') || {}).value || '',
        attachments: JSON.stringify(base64Files) // Attached image data passed as a JSON string
      };

      console.log('Experimental Form data payload:', payload);

      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLtkcmH75TlZSd9M-ehkwpNcTXVnYwBALPfq13H8AEacARCSFXvp_WmOe1RfhrjT9_GQ/exec';

      const params = new URLSearchParams();
      Object.entries(payload).forEach(([key, val]) => params.append(key, val));

      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
      })
        .then(() => {
          if (typeof gtag === 'function') {
            gtag('event', 'form_submission', { 'event_category': 'funnel' });
          }
          // Show success screen
          form.innerHTML = `
          <div class="waitlist-success">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="32" fill="#E8F0EC"/>
              <path d="M26 34L30 38L40 26" stroke="#374A43" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h3>Request Submitted!</h3>
            <p>Thank you. Your free plumber sourcing request has been received. We will analyze your details and get back to you by email shortly.</p>
          </div>
        `;
        })
        .catch((error) => {
          console.error('Fetch POST failed:', error);
          submitBtn.textContent = 'Submit Free Request';
          submitBtn.disabled = false;
          let errEl = form.querySelector('.submit-error');
          if (!errEl) {
            errEl = document.createElement('p');
            errEl.className = 'submit-error';
            errEl.style.cssText = 'color:#C0392B;margin-top:16px;font-size:0.875rem;text-align:center;';
            form.querySelector('.form-actions').appendChild(errEl);
          }
          errEl.textContent = 'Something went wrong. Please check your connection and try again.';
        });
    });
  }
  /* ── Interactive Glue Logic for Hero Job Description Starter ── */
  const heroJobDescription = document.getElementById('heroJobDescription');
  const heroCtaBtn = document.getElementById('heroCtaBtn');
  const formNotes = document.getElementById('q_extra');
  const formPostcode = document.getElementById('fpostcode');

  if (heroCtaBtn && heroJobDescription && formNotes) {
    heroCtaBtn.addEventListener('click', () => {
      const jobDesc = heroJobDescription.value.trim();

      if (jobDesc) {
        // Pre-fill the form's job description field
        formNotes.value = jobDesc;
        formNotes.classList.remove('error');
        const errSpan = formNotes.closest('.form-group').querySelector('.form-error');
        if (errSpan) errSpan.textContent = '';

        // Smooth scroll to waitlist form section (Step 1 postcode checker)
        const waitlistSection = document.getElementById('waitlist');
        if (waitlistSection) {
          const offsetTop = waitlistSection.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }

        // Focus on the postcode input to guide them to check eligibility
        if (formPostcode) {
          setTimeout(() => formPostcode.focus(), 800);
        }
      } else {
        heroJobDescription.focus();
        heroJobDescription.style.borderColor = '#FF5252';
        setTimeout(() => heroJobDescription.style.borderColor = '', 1000);
      }
    });
  }
  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    });
  });

  /* ── Back to Top Button logic ── */
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Founder Video Player logic ── */
  const founderVideo = document.getElementById('founderVideo');
  const founderVideoWrapper = document.getElementById('founderVideoWrapper');
  const founderVideoPlayBtn = document.getElementById('founderVideoPlayBtn');
  const founderVideoMuteBtn = document.getElementById('founderVideoMuteBtn');
  const heroMeetFounderBtn = document.getElementById('heroMeetFounderBtn');

  if (founderVideo && founderVideoWrapper && founderVideoPlayBtn) {
    const updateMuteUI = () => {
      if (founderVideoMuteBtn) {
        const soundOnIcon = founderVideoMuteBtn.querySelector('.sound-on-icon');
        const soundOffIcon = founderVideoMuteBtn.querySelector('.sound-off-icon');
        if (soundOnIcon && soundOffIcon) {
          if (founderVideo.muted) {
            soundOnIcon.style.display = 'none';
            soundOffIcon.style.display = 'block';
            founderVideoMuteBtn.setAttribute('aria-label', 'Unmute sound');
          } else {
            soundOnIcon.style.display = 'block';
            soundOffIcon.style.display = 'none';
            founderVideoMuteBtn.setAttribute('aria-label', 'Mute sound');
          }
        }
      }
    };

    const playVideo = () => {
      founderVideo.muted = false;
      updateMuteUI();

      founderVideo.play()
        .then(() => {
          founderVideoWrapper.classList.add('is-playing');
        })
        .catch(err => {
          console.warn('Video play failed or was prevented:', err);
          founderVideo.muted = true;
          updateMuteUI();
          founderVideo.play()
            .then(() => {
              founderVideoWrapper.classList.add('is-playing');
            })
            .catch(errMuted => {
              console.error('Muted video playback also failed:', errMuted);
            });
        });
    };

    const pauseVideo = () => {
      founderVideo.pause();
      founderVideoWrapper.classList.remove('is-playing');
    };

    founderVideoPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playVideo();
    });

    founderVideo.addEventListener('click', () => {
      if (!founderVideo.paused) {
        pauseVideo();
      } else {
        playVideo();
      }
    });

    founderVideo.addEventListener('ended', () => {
      founderVideoWrapper.classList.remove('is-playing');
      founderVideo.currentTime = 0;
    });

    if (founderVideoMuteBtn) {
      founderVideoMuteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        founderVideo.muted = !founderVideo.muted;
        updateMuteUI();
      });
    }

    if (heroMeetFounderBtn) {
      heroMeetFounderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const videoWrapper = document.getElementById('founderVideoWrapper');
        if (videoWrapper) {
          const rect = videoWrapper.getBoundingClientRect();
          const absoluteTop = rect.top + window.scrollY;
          const videoHeight = rect.height;
          const viewportHeight = window.innerHeight;
          const headerHeight = 80;

          let targetScroll = absoluteTop - headerHeight;
          if (videoHeight < (viewportHeight - headerHeight)) {
            targetScroll = absoluteTop - headerHeight - ((viewportHeight - headerHeight - videoHeight) / 2);
          }

          window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        }

        setTimeout(() => {
          playVideo();
        }, 800);
      });
    }
  }

  /* ── Testimonials swipeable dots logic ── */
  const grid = document.querySelector('.testimonials-grid');
  const dots = document.querySelectorAll('.testimonials-dots .dot');
  if (grid && dots.length > 0) {
    const cards = grid.querySelectorAll('.testimonial-card');
    grid.addEventListener('scroll', () => {
      if (cards.length > 0) {
        const gridRect = grid.getBoundingClientRect();
        let closestIndex = 0;
        let minDiff = Infinity;

        cards.forEach((card, idx) => {
          const cardRect = card.getBoundingClientRect();
          // Distance from the card's left boundary to the grid container's left boundary
          const diff = Math.abs(cardRect.left - gridRect.left);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = idx;
          }
        });

        let visibleDotsCount = 5;
        if (window.innerWidth >= 851) {
          visibleDotsCount = 3;
        } else if (window.innerWidth >= 601) {
          visibleDotsCount = 4;
        }
        const activeIndex = Math.min(closestIndex, visibleDotsCount - 1);

        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === activeIndex);
        });
      }
    }, { passive: true });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        if (cards[idx]) {
          cards[idx].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start'
          });
        }
      });
    });
  }

  /* ── Steps swipeable dots logic ── */
  const stepsGrid = document.querySelector('.steps-grid');
  const stepsDots = document.querySelectorAll('.steps-dots .dot');
  if (stepsGrid && stepsDots.length > 0) {
    const steps = stepsGrid.querySelectorAll('.step');
    stepsGrid.addEventListener('scroll', () => {
      if (steps.length > 0) {
        const stepWidth = steps[0].offsetWidth;
        const stepDistance = stepWidth + 24;
        const index = Math.round(stepsGrid.scrollLeft / stepDistance);
        stepsDots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === index);
        });
      }
    }, { passive: true });

    stepsDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        if (steps[idx]) {
          steps[idx].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start'
          });
        }
      });
    });
  }

  /* ── Founder story expand toggle logic ── */
  const toggleFounderBtn = document.getElementById('toggleFounderMessage');
  const founderBio = document.querySelector('.meet-founder-bio');
  if (toggleFounderBtn && founderBio) {
    toggleFounderBtn.addEventListener('click', () => {
      const isExpanded = founderBio.classList.contains('expanded');
      founderBio.classList.toggle('expanded', !isExpanded);
      toggleFounderBtn.setAttribute('aria-expanded', String(!isExpanded));

      if (isExpanded) {
        toggleFounderBtn.innerHTML = `Read Corban's Message <span class="arrow">↓</span>`;
      } else {
        toggleFounderBtn.innerHTML = `Show Less <span class="arrow">↓</span>`;
      }
    });
  }

  /* ── Testimonials dynamic truncation ── */
  const quotes = document.querySelectorAll('.quote-text');
  const quoteLimit = 110;

  quotes.forEach(quote => {
    const fullText = quote.innerHTML.trim();
    const plainText = quote.textContent.trim();

    if (plainText.length > quoteLimit) {
      let truncateIndex = quoteLimit;
      while (truncateIndex > 0 && plainText[truncateIndex] !== ' ') {
        truncateIndex--;
      }
      if (truncateIndex === 0) truncateIndex = quoteLimit;

      let suffix = '...';
      if (plainText.startsWith('“') || plainText.startsWith('"')) {
        suffix = '...”';
      }

      const truncatedText = plainText.slice(0, truncateIndex).trim() + suffix;
      quote.setAttribute('data-full', fullText);
      quote.setAttribute('data-truncated', truncatedText);

      quote.textContent = truncatedText;

      const seeMoreBtn = document.createElement('span');
      seeMoreBtn.className = 'see-more-btn';
      seeMoreBtn.textContent = 'see more';
      quote.appendChild(seeMoreBtn);

      seeMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = quote.classList.contains('expanded');
        if (isExpanded) {
          quote.textContent = truncatedText;
          seeMoreBtn.textContent = 'see more';
          quote.appendChild(seeMoreBtn);
          quote.classList.remove('expanded');
        } else {
          quote.innerHTML = fullText;
          seeMoreBtn.textContent = 'show less';
          quote.appendChild(seeMoreBtn);
          quote.classList.add('expanded');
        }
      });
    }
  });

})();
