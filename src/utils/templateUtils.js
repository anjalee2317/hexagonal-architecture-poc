const fs = require('fs');
const path = require('path');

/**
 * Loads a template file from the templates directory
 * @param {string} templateName - The name of the template file without extension
 * @param {string} format - The format of the template ('html' or 'txt')
 * @returns {string} The template content
 */
function loadTemplate(templateName, format) {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'email', `${templateName}.${format}`);
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error(`Error loading template ${templateName}.${format}:`, error);
    throw error;
  }
}

/**
 * Renders a template by replacing placeholders with values
 * @param {string} template - The template string
 * @param {Object} data - The data object with key-value pairs to replace in the template
 * @returns {string} The rendered template
 */
function renderTemplate(template, data) {
  let rendered = template;
  
  // Replace all placeholders in the format {{key}} with their corresponding values
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(placeholder, data[key]);
  });
  
  return rendered;
}

module.exports = {
  loadTemplate,
  renderTemplate
};
