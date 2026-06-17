function ok(data) {
  return {
    success: true,
    data,
  };
}

function fail(message, code = 'INTERNAL_ERROR') {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

module.exports = {
  ok,
  fail,
};
