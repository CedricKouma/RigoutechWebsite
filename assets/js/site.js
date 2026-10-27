"use strict";

document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js");

(function () {
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");

  if (!toggle || !panel) {
    return;
  }

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    const english = document.documentElement.lang
      .toLowerCase()
      .startsWith("en");
    toggle.textContent = open ? (english ? "Close" : "Fermer") : "Menu";
  }

  toggle.addEventListener("click", function () {
    setOpen(!panel.classList.contains("is-open"));
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && panel.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  panel.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      setOpen(false);
    }
  });
})();

(function () {
  const form = document.querySelector("[data-contact-form]");

  if (!form) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const sujet = params.get("sujet");
  const select = form.querySelector("[name='sujet']");

  if (sujet && select) {
    const match = Array.from(select.options).some(function (option) {
      return option.value === sujet;
    });

    if (match) {
      select.value = sujet;
    }
  }

  form.addEventListener("submit", function (event) {
    const feedback = form.querySelector("[data-feedback]");
    const honey = form.querySelector("[name='societe_site']");

    if (honey && honey.value.trim() !== "") {
      event.preventDefault();
      return;
    }

    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }

    event.preventDefault();

    const data = new FormData(form);
    const lines = [];

    data.forEach(function (value, key) {
      if (!value || key === "societe_site") {
        return;
      }

      lines.push(key.replaceAll("_", " ") + " : " + String(value).trim());
    });

    const subject =
      form.getAttribute("data-subject") || "Message depuis rigoutech.com";
    const mailto =
      "mailto:info@rigoutech.com?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(lines.join("\n"));

    window.location.href = mailto;

    if (feedback) {
      feedback.textContent =
        "Votre logiciel de courriel devrait s’ouvrir. Le message part seulement quand vous l’envoyez. Sinon, écrivez à info@rigoutech.com.";
    }
  });
})();
