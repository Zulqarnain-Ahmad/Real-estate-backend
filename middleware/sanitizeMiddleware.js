const sanitizeValue = (value) => {
  if (value && typeof value === 'object') {
    for (const key in value) {
      if (/^\$/.test(key) || /\./.test(key)) {
        delete value[key];
      } else {
        sanitizeValue(value[key]);
      }
    }
  }
  return value;
};

const sanitizeInputs = (req, res, next) => {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  next();
};

module.exports = sanitizeInputs;