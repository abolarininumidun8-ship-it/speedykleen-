document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Mobile Menu Navigation Toggle ---
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // --- 2. Zip Code Availability Checker ---
  const zipForm = document.getElementById('zipForm');
  const zipInput = document.getElementById('zipInput');
  const zipResult = document.getElementById('zipResult');

  const validZipCodes = Array.from(zipInput.options, option => option.value).filter(Boolean);

  if (zipForm) {
    zipForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = zipInput.value.trim();

      if (validZipCodes.includes(code)) {
        zipResult.className = 'zip-result success';
        zipResult.innerHTML = `<i class="fa-solid fa-circle-check"></i> Great news! SpeedyKleen services Zip Code ${code}.`;
      } else {
        zipResult.className = 'zip-result error';
        zipResult.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Sorry, we aren't servicing ${code} yet. Check back soon!`;
      }
    });
  }

  // --- 3. Instant Price Calculator Logic ---
  const bedInput = document.getElementById('bedrooms');
  const bathInput = document.getElementById('bathrooms');
  const bedVal = document.getElementById('bedVal');
  const bathVal = document.getElementById('bathVal');
  const totalPriceDisplay = document.getElementById('totalPrice');
  const currencySelect = document.getElementById('currencySelect');
  const currencySymbols = document.querySelectorAll('.currency-symbol');
  const addonPrices = document.querySelectorAll('.addon-price');
  const freqBtns = document.querySelectorAll('.freq-btn');
  const addonChecks = document.querySelectorAll('.addon-check');
  const calcTypes = document.querySelectorAll('input[name="calcType"]');
  const applyEstimateBtn = document.getElementById('applyEstimateBtn');

  const usdToNgnRate = 1330;
  let currentDiscount = 0.20; // Default: Weekly 20% discount

  function updateCurrencySymbols() {
    const isNaira = currencySelect.value === 'NGN';
    const symbol = isNaira ? '₦' : '$';
    currencySymbols.forEach(currencySymbol => {
      currencySymbol.textContent = symbol;
    });

    addonPrices.forEach(addonPrice => {
      const usdPrice = Number(addonPrice.dataset.usdPrice);
      const convertedPrice = isNaira ? usdPrice * usdToNgnRate : usdPrice;
      addonPrice.textContent = new Intl.NumberFormat('en-US').format(Math.round(convertedPrice));
    });
  }

  function calculatePrice() {
    const beds = parseInt(bedInput.value, 10);
    const baths = parseInt(bathInput.value, 10);

    // Update UI slider values
    bedVal.textContent = beds;
    bathVal.textContent = baths;

    // Base Price calculation
    let basePrice = 50 + (beds * 25) + (baths * 20);

    // Selected Cleaning Type Multiplier
    const selectedType = document.querySelector('input[name="calcType"]:checked').value;
    if (selectedType === 'deep') {
      basePrice *= 1.4;
    } else if (selectedType === 'movein') {
      basePrice *= 1.6;
    }

    // Add-ons total calculation
    let addonsTotal = 0;
    addonChecks.forEach(check => {
      if (check.checked) {
        addonsTotal += parseFloat(check.value);
      }
    });

    // Final total calculation applying frequency discount
    let total = (basePrice * (1 - currentDiscount)) + addonsTotal;

    if (currencySelect.value === 'NGN') {
      total *= usdToNgnRate;
    }

    totalPriceDisplay.textContent = new Intl.NumberFormat('en-US').format(Math.round(total));
    updateCurrencySymbols();
  }

  // Event Listeners for Calculator Inputs
  if (bedInput && bathInput) {
    bedInput.addEventListener('input', calculatePrice);
    bathInput.addEventListener('input', calculatePrice);

    calcTypes.forEach(radio => radio.addEventListener('change', calculatePrice));
    addonChecks.forEach(check => check.addEventListener('change', calculatePrice));

    freqBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        freqBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentDiscount = parseFloat(e.target.getAttribute('data-discount'));
        calculatePrice();
      });
    });

    currencySelect.addEventListener('change', calculatePrice);

    // Initial calculation on load
    calculatePrice();
  }

  // Apply Estimate to Booking Form Smoothly
  if (applyEstimateBtn) {
    applyEstimateBtn.addEventListener('click', () => {
      const bookingSection = document.getElementById('booking');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // --- 4. Interactive FAQ Accordion ---
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.parentElement;
      
      // Close other active accordions
      document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
          item.classList.remove('active');
        }
      });

      // Toggle current
      faqItem.classList.toggle('active');
    });
  });

  // --- 5. Booking Form Submission Handling ---
  const bookingForm = document.getElementById('bookingForm');
  const bookingDate = document.getElementById('bookingDate');
  const bookingTime = document.getElementById('bookingTime');
  const bookingAvailability = document.getElementById('bookingAvailability');
  const bookedSlotsList = document.getElementById('bookedSlotsList');
  const bookedSlotsStorageKey = 'speedyKleenBookedSlots';
  let bookedSlots = [];
  let bookingStorageAvailable = true;

  function setBookingMessage(message, type = '') {
    bookingAvailability.textContent = message;
    bookingAvailability.className = `booking-availability${type ? ` ${type}` : ''}`;
  }

  function loadBookedSlots() {
    try {
      const savedSlots = window.localStorage.getItem(bookedSlotsStorageKey);
      if (!savedSlots) {
        return [];
      }

      const parsedSlots = JSON.parse(savedSlots);
      const validTimes = Array.from(bookingTime.options, option => option.value).filter(Boolean);
      const isValidSlot = slot =>
        slot &&
        /^\d{4}-\d{2}-\d{2}$/.test(slot.date) &&
        validTimes.includes(slot.time);

      if (!Array.isArray(parsedSlots) || !parsedSlots.every(isValidSlot)) {
        throw new Error('Saved booking data has an invalid format.');
      }

      return parsedSlots;
    } catch (error) {
      console.error('Unable to load saved bookings:', error);
      bookingStorageAvailable = false;
      setBookingMessage('Saved bookings could not be loaded. Booking is unavailable.', 'error');
      return null;
    }
  }

  function formatBookingDate(date) {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function renderBookedSlots() {
    bookedSlotsList.replaceChildren();

    if (bookedSlots.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.textContent = 'No appointments booked yet.';
      bookedSlotsList.appendChild(emptyMessage);
    } else {
      bookedSlots
        .slice()
        .sort((first, second) => first.date.localeCompare(second.date) || first.time.localeCompare(second.time))
        .forEach(slot => {
          const item = document.createElement('li');
          item.textContent = `${formatBookingDate(slot.date)} — ${slot.time}`;
          bookedSlotsList.appendChild(item);
        });
    }

    Array.from(bookingTime.options).forEach(option => {
      if (!option.value) {
        return;
      }

      if (!option.dataset.defaultLabel) {
        option.dataset.defaultLabel = option.textContent;
      }

      const isBooked = bookedSlots.some(slot =>
        slot.date === bookingDate.value && slot.time === option.value
      );
      option.disabled = isBooked;
      option.textContent = isBooked
        ? `${option.dataset.defaultLabel} (Already booked)`
        : option.dataset.defaultLabel;
    });
  }

  function updateBookingAvailability() {
    if (!bookingStorageAvailable) {
      return;
    }

    const selectedDate = bookingDate.value;
    const isSunday = selectedDate && new Date(`${selectedDate}T12:00:00`).getDay() === 0;
    bookingDate.setCustomValidity(isSunday ? 'We are closed on Sundays. Please choose another date.' : '');
    renderBookedSlots();

    if (isSunday) {
      bookingTime.value = '';
      setBookingMessage('We are closed on Sundays. Please choose another date.', 'error');
      return;
    }

    if (selectedDate && bookingTime.value && bookingTime.selectedOptions[0].disabled) {
      bookingTime.value = '';
      setBookingMessage('That date and time has already been booked. Please choose another slot.', 'error');
      return;
    }

    if (selectedDate && Array.from(bookingTime.options).filter(option => option.value).every(option => option.disabled)) {
      setBookingMessage('All time slots for this date have already been booked.', 'error');
      return;
    }

    setBookingMessage(selectedDate ? '' : 'Select a date to check available times.');
  }

  if (bookingForm) {
    const today = new Date();
    bookingDate.min = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');

    const savedSlots = loadBookedSlots();
    if (savedSlots) {
      bookedSlots = savedSlots;
      renderBookedSlots();
      updateBookingAvailability();
    } else {
      bookingForm.querySelector('button[type="submit"]').disabled = true;
    }

    bookingDate.addEventListener('change', updateBookingAvailability);
    bookingTime.addEventListener('change', updateBookingAvailability);

    window.addEventListener('storage', event => {
      if (event.key !== bookedSlotsStorageKey && event.key !== null) {
        return;
      }

      const latestSlots = loadBookedSlots();
      if (latestSlots) {
        bookedSlots = latestSlots;
        bookingStorageAvailable = true;
        bookingForm.querySelector('button[type="submit"]').disabled = false;
        renderBookedSlots();
        updateBookingAvailability();
      } else {
        bookingForm.querySelector('button[type="submit"]').disabled = true;
      }
    });

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!bookingStorageAvailable) {
        setBookingMessage('Booking is unavailable because saved appointments could not be accessed.', 'error');
        return;
      }

      const name = document.getElementById('fullName').value;
      const date = bookingDate.value;
      const time = bookingTime.value;

      if (new Date(`${date}T12:00:00`).getDay() === 0) {
        updateBookingAvailability();
        return;
      }

      if (bookedSlots.some(slot => slot.date === date && slot.time === time)) {
        setBookingMessage('That date and time has already been booked. Please choose another slot.', 'error');
        renderBookedSlots();
        return;
      }

      const newSlot = { date, time };
      try {
        window.localStorage.setItem(
          bookedSlotsStorageKey,
          JSON.stringify([...bookedSlots, newSlot])
        );
      } catch (error) {
        console.error('Unable to save booking:', error);
        bookingStorageAvailable = false;
        bookingForm.querySelector('button[type="submit"]').disabled = true;
        setBookingMessage('Your booking could not be saved. Please try again later.', 'error');
        return;
      }

      bookedSlots.push(newSlot);
      renderBookedSlots();

      alert(`Thank you, ${name}! Your booking request for ${date} at ${time} has been received. Our team will contact you shortly to confirm!`);

      bookingForm.reset();
      updateBookingAvailability();
    });
  }
});

// Helper function to pre-select a service from cards
function selectService(serviceType) {
  const calcRadio = document.querySelector(`input[name="calcType"][value="${serviceType}"]`);
  if (calcRadio) {
    calcRadio.checked = true;
    calcRadio.dispatchEvent(new Event('change'));
  }
}