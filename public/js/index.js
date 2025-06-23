document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.querySelector('.nav__el--logout');
  const loginBtn = document.querySelector('.form--login');
  const updateUserForm = document.querySelector('.form-user-data');
  const updateUserPasswordForm = document.querySelector('.form-user-settings');

  const uploadBtn = document.querySelector('.btn-text');
  const settingBtn = document.querySelector('.btn--setting');

  const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
  };

  const closeAlert = () => {
    const el = document.querySelector('.alert-close');
    el.addEventListener('click', function () {
      el.parentElement.removeChild(el);
    });
  };

  const showAlert = (type, msg) => {
    hideAlert();

    const markup = `<div class="alert alert--${type}">
    <p> ${msg}</p>
    <!-- <span class='alert-close'>&times;</span> -->
  </div>`;

    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

    window.setTimeout(hideAlert, 1500);
  };

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        showAlert('success', 'Login successfully');

        window.setTimeout(() => {
          location.assign('/');
        }, 1500);
      }

      if (data.status === 'fail') {
        throw new Error(data.message);
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  const logout = async () => {
    try {
      const res = await fetch('/api/v1/users/logout', {
        method: 'GET',
      });

      const data = await res.json();

      if (data.status === 'success') {
        showAlert('success', 'Logout successfully');

        window.setTimeout(() => {
          location.assign('/');
        }, 1500);
      }

      if (data.status === 'error') {
        throw new Error('Something went wrong while logging out');
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  const updateUserData = async (form) => {
    try {
      settingBtn.textContent = 'Loading...';
      const res = await fetch('/api/v1/users/updateMe', {
        method: 'PATCH',

        body: form,
        // headers: {
        //   'Content-Type': 'application/json',
        // },

        // body: JSON.stringify({
        //   name,
        //   email,
        //   photo,
        // }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        showAlert('success', 'Update data successfully');

        window.setTimeout(() => {
          location.reload();
        }, 1500);
      }

      if (data.status === 'fail') {
        throw new Error(data.message);
      }

      settingBtn.textContent = 'save settings';
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  const updateUserPassword = async (
    passwordCurrent,
    password,
    passwordConfirm,
  ) => {
    try {
      const res = await fetch('/api/v1/users/updatePassword', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          passwordCurrent,
          password,
          passwordConfirm,
        }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        showAlert('success', 'Update Password successfully');

        window.setTimeout(() => {
          location.reload();
        }, 1500);
      }

      if (data.status === 'fail') {
        throw new Error(data.message);
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  if (loginBtn)
    loginBtn.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;

      login(email, password);
    });

  if (logoutBtn)
    logoutBtn.addEventListener('click', () => {
      logout();
    });

  if (updateUserForm)
    updateUserForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const form = new FormData();
      form.append('name', document.querySelector('#name').value);
      form.append('email', document.querySelector('#email').value);
      form.append('photo', document.querySelector('#file-upload').files[0]);

      // const name = document.querySelector('#name').value;
      // const email = document.querySelector('#email').value;
      // const photo = document.querySelector('#file-upload').files[0];

      updateUserData(form);
    });

  if (updateUserPasswordForm)
    updateUserPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const passwordCurrent = document.querySelector('#password-current').value;
      const password = document.querySelector('#password').value;
      const passwordConfirm = document.querySelector('#password-confirm').value;

      updateUserPassword(passwordCurrent, password, passwordConfirm);
    });

  if (uploadBtn)
    uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const fileInput = document.querySelector('#file-upload');

      fileInput.click();
    });

  const bookTourBtn = document.querySelector('#book-tour');
  const stripe = Stripe(
    'pk_test_51RYspzRXLmvUwgmCt4TaAtifPHjlJAYyf9rPibIqD7m3esboTUEBMvjYBqOsMkupEVk8LooWYVWwEyXdhNSkfh7f00Q1KFLehj',
  );

  const bookTour = async (tourId) => {
    const res = await fetch(`/api/v1/bookings/checkout-session/${tourId}`, {
      method: 'GET',
    });

    const session = await res.json();
    console.log(session);

    stripe.redirectToCheckout({
      sessionId: session.id || session.session.id,
    });
  };

  if (bookTourBtn)
    bookTourBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.target.textContent = 'Processing...';
      const { tourId } = e.target.dataset;

      bookTour(tourId);
      e.target.textContent = 'Book tour now!';
    });
});
