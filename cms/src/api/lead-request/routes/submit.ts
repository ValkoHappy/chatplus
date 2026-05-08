export default {
  routes: [
    {
      method: 'POST',
      path: '/lead-requests/submit',
      handler: 'lead-request.submit',
      config: {
        auth: false,
      },
    },
  ],
};
