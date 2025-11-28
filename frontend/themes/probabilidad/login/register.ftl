<#-- register.ftl - Tema Probabilidad (Keycloak 26+) -->
<#import "template.ftl" as layout>
<#import "user-profile-commons.ftl" as userProfileCommons>
<#import "register-commons.ftl" as registerCommons>

<@layout.registrationLayout displayMessage=messagesPerField.exists('global') displayRequiredFields=false; section>

  <#-- ===================== HEADER + ESTILOS ===================== -->
  <#if section == "header">
    <style>
      /* === Paleta base Probabilidad === */
      :root{
        --kc-primary: #0A84FF;   /* azul principal (botón primario) */
        --kc-accent:  #FFC857;   /* dorado/acento */
        --kc-bg:      #0F172A;   /* fondo oscuro */
        --kc-text:    #FFFFFF;   /* texto principal */
        --kc-secondary:#1E293B;  /* gris-azulado oscuro */
      }

      /* Fondo general */
      body, .login-pf, .kc-body{
      background: var(--kc-white) !important;
      color: var(--kc-text-main);
      font-family: Inter, Segoe UI, system-ui, -apple-system, Arial, sans-serif;
    }

      /* Header / logo superior */
      .kc-header{
        position: fixed; top: 24px; left: 0; right: 0;
        display:flex; justify-content:center; align-items:center; gap:.6rem;
        color: var(--kc-accent); text-transform: lowercase; letter-spacing:.12em; font-weight:700; z-index:2;
      }
      .kc-header .logo{
        width: 28px; height: 28px; border-radius:6px;
        background: linear-gradient(135deg, var(--kc-accent), #ffd975 60%, #b88a1a);
        display:inline-flex; justify-content:center; align-items:center; color:#111; font-weight:900;
      }

      /* Centrado / contenedor */
      .login-pf-page, .login-pf-page .login-pf-page-container{
        display:flex; align-items:center; justify-content:center;
        min-height:100vh;
        padding:96px 16px 24px;
      }

      /* Card */
      .pf-v5-c-card, .card-pf{
        background:#0b1324; border-radius:14px; border:1px solid #12203a;
        box-shadow:0 18px 70px rgba(0,0,0,.45);
        width:100%; max-width:560px; padding:24px 22px 28px !important; color:var(--kc-text);
        animation:fadeIn .45s ease-out both;
      }
      @keyframes fadeIn{from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none}}

      /* Títulos */
      h1, h2, h3, .pf-v5-c-title{
        color:var(--kc-accent);
        font-weight:700; text-align:center; margin:0 0 1.25rem;
      }
      .kc-subtitle{
        text-align:center; color:var(--kc-text); margin-top:72px;
        font-size:1.2rem; letter-spacing:.05em; font-weight:500;
      }

      /* Labels / inputs */
      label{ font-size:.9rem; color:#e9eef9; display:block; margin:0 0 6px; }
      input[type="text"], input[type="email"], input[type="password"],
      .pf-v5-c-form-control, .form-control, select{
        width:100%; background:#0f1a31 !important; color:var(--kc-text) !important;
        border:1px solid #1f315a !important; border-radius:10px !important;
        padding:12px 14px !important; transition:border-color .25s ease, box-shadow .25s ease;
      }
      input:focus, select:focus{
        outline:none; border-color:var(--kc-accent) !important; box-shadow:0 0 0 3px rgba(255,200,87,.18);
      }

      /* Grupo de password con botón ojo */
      .input-password{ position:relative; }
      .input-password input{
        width:100%; background:#0f1a31; color:var(--kc-text);
        border:1px solid #1f315a; border-radius:10px;
        padding:12px 44px 12px 14px; transition:border-color .25s ease;
      }
      .input-password input:focus{
        border-color:var(--kc-accent); box-shadow:0 0 0 3px rgba(255,200,87,.18);
      }
      .input-password button.toggle{
        position:absolute; right:8px; top:50%; transform:translateY(-50%);
        background:transparent; border:none; color:#c9d6ff; width:34px; height:34px;
        cursor:pointer; border-radius:8px; display:flex; align-items:center; justify-content:center;
        transition: background .2s ease, color .2s ease;
      }
      .input-password button.toggle:hover{ background:#152245; }

      /* Icono ojo (estados) */
      .input-password button.toggle i,
      .input-password button.toggle i.fa-eye,
      .input-password button.toggle i.fa-eye-slash{
        color: var(--kc-accent) !important; transition: color .2s ease, transform .2s ease;
      }
      .input-password button.toggle:hover i{ color:#fff !important; transform:scale(1.08); }
      .input-password button.toggle.active i,
      .input-password button.toggle[aria-pressed="true"] i,
      .input-password button.toggle[data-visible="true"] i{
        color: var(--kc-primary) !important; /* azul cuando visible */
      }
      .input-password button.toggle:active{ background:#0f1f44; }

      /* Botón primario (azul) + hover (dorado) */
      .pf-v5-c-button.pf-m-primary,
      .btn.btn-primary,
      #kc-register-form input[type="submit"],
      #kc-register-form button[type="submit"]{
        width:100%; background:var(--kc-primary) !important; border:1px solid transparent !important;
        border-radius:10px !important; color:#f8fbff !important;
        font-weight:700; letter-spacing:.02em; padding:12px 14px;
        transition: transform .2s ease, background-color .2s ease, filter .15s ease;
      }
      .pf-v5-c-button.pf-m-primary:hover,
      .btn.btn-primary:hover,
      #kc-register-form input[type="submit"]:hover,
      #kc-register-form button[type="submit"]:hover{
        background:var(--kc-accent) !important; color:#1a1a1a !important; transform:translateY(-1px);
      }

      /* Botones secundarios */
      .pf-v5-c-button, .btn{
        background:var(--kc-secondary); color:var(--kc-text);
        border-radius:10px; border:1px solid #1f315a;
      }
      .pf-v5-c-button:hover, .btn:hover{ background:#162640; transform:translateY(-1px); }

      /* Links */
      a{ color:var(--kc-accent); font-weight:500; text-decoration:none; }
      a:hover{ text-decoration:underline; }

      /* Alertas */
      .pf-v5-c-alert, .alert{
        background:#11253e; border-left:4px solid var(--kc-primary);
        color:#cfe6ff; border-radius:10px; padding:10px 12px;
      }

      /* Compatibilidad PatternFly + padding para ícono */
      #kc-form .pf-v5-c-input-group{ align-items:center; }
      #kc-form .pf-v5-c-input-group > input,
      #password, #password-confirm{
        padding-right:42px !important; background:#0f1a31 !important;
      }

      /* Oculta header viejo de KC */
      #kc-header{ display:none !important; }

      /* Alineación subtítulo */
      #kc-content .kc-subtitle{ text-align:center; }
    </style>

    <header class="kc-header">
      <div class="logo">P</div><span>probabilidad</span>
    </header>
    <h2 class="kc-subtitle">Register</h2>

  <#-- =================== FORMULARIO =================== -->
  <#elseif section == "form">
    <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">

      <@userProfileCommons.userProfileFormFields; callback, attribute>
        <#-- Ya no inyectamos passwords aquí para evitar que falte el primero -->
      </@userProfileCommons.userProfileFormFields>

      <#-- Campos de contraseña SIEMPRE visibles cuando se requieren -->
      <#if passwordRequired??>
        <div class="${properties.kcFormGroupClass!}">
          <div class="${properties.kcLabelWrapperClass!}">
            <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label> *
          </div>
          <div class="${properties.kcInputWrapperClass!}">
            <div class="input-password">
              <input type="password" id="password" class="${properties.kcInputClass!}" name="password"
                     autocomplete="new-password"
                     aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>" />
              <button type="button" class="toggle" aria-label="${msg('showPassword')}"
                      aria-controls="password" data-password-toggle>
                <i class="fa fa-eye" aria-hidden="true"></i>
              </button>
            </div>
            <#if messagesPerField.existsError('password')>
              <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                ${kcSanitize(messagesPerField.get('password'))?no_esc}
              </span>
            </#if>
          </div>
        </div>

        <div class="${properties.kcFormGroupClass!}">
          <div class="${properties.kcLabelWrapperClass!}">
            <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label> *
          </div>
          <div class="${properties.kcInputWrapperClass!}">
            <div class="input-password">
              <input type="password" id="password-confirm" class="${properties.kcInputClass!}" name="password-confirm"
                     autocomplete="new-password"
                     aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>" />
              <button type="button" class="toggle" aria-label="${msg('showPassword')}"
                      aria-controls="password-confirm" data-password-toggle>
                <i class="fa fa-eye" aria-hidden="true"></i>
              </button>
            </div>
            <#if messagesPerField.existsError('password-confirm')>
              <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
              </span>
            </#if>
          </div>
        </div>
      </#if>

      <@registerCommons.termsAcceptance/>

      <#if recaptchaRequired?? && (recaptchaVisible!false)>
        <div class="form-group">
          <div class="${properties.kcInputWrapperClass!}">
            <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}" data-action="${recaptchaAction}"></div>
          </div>
        </div>
      </#if>

      <div class="${properties.kcFormGroupClass!}">
        <div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
          <div class="${properties.kcFormOptionsWrapperClass!}">
            <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
          </div>
        </div>

        <#-- Botón registrar: soporta caso con reCAPTCHA invisible -->
        <#if recaptchaRequired?? && !(recaptchaVisible!false)>
          <script>
            function onSubmitRecaptcha(token) {
              document.getElementById("kc-register-form").requestSubmit();
            }
          </script>
          <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
            <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!} g-recaptcha"
                    data-sitekey="${recaptchaSiteKey}" data-callback='onSubmitRecaptcha' data-action='${recaptchaAction}' type="submit">
              ${msg("doRegister")}
            </button>
          </div>
        <#else>
          <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegister")}"/>
          </div>
        </#if>
      </div>
    </form>

    <script>
      /* Toggle de visibilidad para ambos passwords */
      (function () {
        const wraps = document.querySelectorAll('#kc-register-form .input-password');
        wraps.forEach(wrap => {
          const btn = wrap.querySelector('button.toggle');
          const input = wrap.querySelector('input[type="password"], input[type="text"]');
          if (!btn || !input) return;

          function setState(show) {
            input.type = show ? 'text' : 'password';
            btn.classList.toggle('active', show);
            btn.setAttribute('aria-pressed', String(show));
            btn.dataset.visible = show ? 'true' : 'false';
            const icon = btn.querySelector('i');
            if (icon && icon.classList.contains('fa')) {
              icon.classList.toggle('fa-eye', !show);
              icon.classList.toggle('fa-eye-slash', show);
            }
          }

          btn.addEventListener('click', () => setState(input.type !== 'text'));
        });
      })();
    </script>

  </#if>

</@layout.registrationLayout>
