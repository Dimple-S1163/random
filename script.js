const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

const PRESETS = {
  web: {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true
  },
  database: {
    length: 32,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true
  },
  api: {
    length: 48,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: false
  }
};

class PasswordGenerator {
  constructor() {
    this.elements = {
      lengthSlider: document.getElementById('lengthSlider'),
      lengthValue: document.getElementById('lengthValue'),
      includeUppercase: document.getElementById('includeUppercase'),
      includeLowercase: document.getElementById('includeLowercase'),
      includeNumbers: document.getElementById('includeNumbers'),
      includeSpecial: document.getElementById('includeSpecial'),
      generateBtn: document.getElementById('generateBtn'),
      regenerateBtn: document.getElementById('regenerateBtn'),
      copyBtn: document.getElementById('copyBtn'),
      passwordOutput: document.getElementById('passwordOutput'),
      toggleVisibility: document.getElementById('toggleVisibility'),
      strengthBar: document.getElementById('strengthBar'),
      strengthText: document.getElementById('strengthText'),
      entropyText: document.getElementById('entropyText'),
      themeToggle: document.getElementById('themeToggle'),
      presetButtons: document.querySelectorAll('.preset-btn'),
      toast: document.getElementById('toast')
    };

    this.currentPassword = '';
    this.isPasswordVisible = false;

    this.init();
  }

  init() {
    this.initTheme();
    this.attachEventListeners();
    this.updateLengthDisplay();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  attachEventListeners() {
    this.elements.lengthSlider.addEventListener('input', () => {
      this.updateLengthDisplay();
    });

    this.elements.generateBtn.addEventListener('click', () => {
      this.generatePassword();
    });

    this.elements.regenerateBtn.addEventListener('click', () => {
      this.generatePassword();
    });

    this.elements.copyBtn.addEventListener('click', () => {
      this.copyToClipboard();
    });

    this.elements.toggleVisibility.addEventListener('click', () => {
      this.togglePasswordVisibility();
    });

    this.elements.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });

    this.elements.presetButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const preset = e.currentTarget.getAttribute('data-preset');
        this.applyPreset(preset);
      });
    });

    [
      this.elements.includeUppercase,
      this.elements.includeLowercase,
      this.elements.includeNumbers,
      this.elements.includeSpecial
    ].forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.validateOptions();
      });
    });

    this.elements.passwordOutput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.currentPassword) {
        this.copyToClipboard();
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        this.generatePassword();
      }
    });
  }

  updateLengthDisplay() {
    const length = this.elements.lengthSlider.value;
    this.elements.lengthValue.textContent = length;
  }

  getOptions() {
    return {
      length: parseInt(this.elements.lengthSlider.value),
      includeUppercase: this.elements.includeUppercase.checked,
      includeLowercase: this.elements.includeLowercase.checked,
      includeNumbers: this.elements.includeNumbers.checked,
      includeSpecial: this.elements.includeSpecial.checked
    };
  }

  setOptions(options) {
    this.elements.lengthSlider.value = options.length;
    this.elements.includeUppercase.checked = options.uppercase;
    this.elements.includeLowercase.checked = options.lowercase;
    this.elements.includeNumbers.checked = options.numbers;
    this.elements.includeSpecial.checked = options.special;
    this.updateLengthDisplay();
  }

  validateOptions() {
    const options = this.getOptions();
    const hasAtLeastOneOption =
      options.includeUppercase ||
      options.includeLowercase ||
      options.includeNumbers ||
      options.includeSpecial;

    this.elements.generateBtn.disabled = !hasAtLeastOneOption;
    this.elements.regenerateBtn.disabled = !hasAtLeastOneOption;

    if (!hasAtLeastOneOption) {
      this.showToast('Please select at least one character type', 'error');
    }

    return hasAtLeastOneOption;
  }

  applyPreset(presetName) {
    const preset = PRESETS[presetName];
    if (preset) {
      this.setOptions(preset);
      this.generatePassword();
      this.showToast(`Applied ${presetName.charAt(0).toUpperCase() + presetName.slice(1)} preset`, 'success');
    }
  }

  generatePassword() {
    if (!this.validateOptions()) {
      return;
    }

    const options = this.getOptions();
    let characterPool = '';

    if (options.includeUppercase) characterPool += CHARACTER_SETS.uppercase;
    if (options.includeLowercase) characterPool += CHARACTER_SETS.lowercase;
    if (options.includeNumbers) characterPool += CHARACTER_SETS.numbers;
    if (options.includeSpecial) characterPool += CHARACTER_SETS.special;

    if (characterPool.length === 0) {
      this.showToast('No character types selected', 'error');
      return;
    }

    let password = '';
    const array = new Uint32Array(options.length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < options.length; i++) {
      password += characterPool[array[i] % characterPool.length];
    }

    password = this.ensureMinimumComplexity(password, options);

    this.currentPassword = password;
    this.elements.passwordOutput.value = password;

    this.updateStrengthIndicator(password, characterPool.length);
    this.updateEntropyDisplay(password, characterPool.length);

    this.elements.generateBtn.classList.add('generating');
    setTimeout(() => {
      this.elements.generateBtn.classList.remove('generating');
    }, 300);

    if (!this.isPasswordVisible) {
      this.elements.passwordOutput.type = 'text';
    }
  }

  ensureMinimumComplexity(password, options) {
    const requirements = [];

    if (options.includeUppercase) requirements.push(CHARACTER_SETS.uppercase);
    if (options.includeLowercase) requirements.push(CHARACTER_SETS.lowercase);
    if (options.includeNumbers) requirements.push(CHARACTER_SETS.numbers);
    if (options.includeSpecial) requirements.push(CHARACTER_SETS.special);

    let passwordArray = password.split('');
    let modified = false;

    requirements.forEach((charset, index) => {
      const hasChar = passwordArray.some(char => charset.includes(char));
      if (!hasChar && passwordArray.length > index) {
        const randomIndex = Math.floor(Math.random() * passwordArray.length);
        const charIndex = Math.floor(Math.random() * charset.length);
        passwordArray[randomIndex] = charset[charIndex];
        modified = true;
      }
    });

    return modified ? passwordArray.join('') : password;
  }

  calculateEntropy(password, poolSize) {
    if (!password || poolSize === 0) return 0;
    return Math.log2(Math.pow(poolSize, password.length));
  }

  assessStrength(entropy) {
    if (entropy < 50) {
      return { level: 'weak', percentage: 33 };
    } else if (entropy < 80) {
      return { level: 'medium', percentage: 66 };
    } else {
      return { level: 'strong', percentage: 100 };
    }
  }

  updateStrengthIndicator(password, poolSize) {
    const entropy = this.calculateEntropy(password, poolSize);
    const strength = this.assessStrength(entropy);

    this.elements.strengthBar.className = 'strength-bar-fill ' + strength.level;
    this.elements.strengthBar.style.width = strength.percentage + '%';
    this.elements.strengthBar.setAttribute('aria-valuenow', strength.percentage);

    this.elements.strengthText.className = 'strength-text ' + strength.level;
    this.elements.strengthText.textContent =
      strength.level.charAt(0).toUpperCase() + strength.level.slice(1) + ' Password';
  }

  updateEntropyDisplay(password, poolSize) {
    const entropy = this.calculateEntropy(password, poolSize);
    this.elements.entropyText.textContent = `Entropy: ${entropy.toFixed(2)} bits`;
  }

  async copyToClipboard() {
    if (!this.currentPassword) {
      this.showToast('No password to copy', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(this.currentPassword);
      this.showToast('Password copied to clipboard!', 'success');

      this.elements.copyBtn.classList.add('generating');
      setTimeout(() => {
        this.elements.copyBtn.classList.remove('generating');
      }, 300);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = this.currentPassword;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        this.showToast('Password copied to clipboard!', 'success');
      } catch (err) {
        this.showToast('Failed to copy password', 'error');
      }

      document.body.removeChild(textarea);
    }
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;

    if (this.isPasswordVisible) {
      this.elements.passwordOutput.classList.add('hidden');
      this.elements.toggleVisibility.classList.add('visible');
      this.elements.toggleVisibility.setAttribute('aria-label', 'Show password');
    } else {
      this.elements.passwordOutput.classList.remove('hidden');
      this.elements.toggleVisibility.classList.remove('visible');
      this.elements.toggleVisibility.setAttribute('aria-label', 'Hide password');
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    this.showToast(
      `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`,
      'success'
    );
  }

  showToast(message, type = 'success') {
    this.elements.toast.textContent = message;
    this.elements.toast.className = `toast ${type}`;

    setTimeout(() => {
      this.elements.toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      this.elements.toast.classList.remove('show');
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PasswordGenerator();
});
