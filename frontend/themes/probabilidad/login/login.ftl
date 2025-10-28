<#-- login.ftl - Tema Probabilidad (Keycloak 26+) -->
<#import "template.ftl" as layout>

<@layout.registrationLayout
    displayMessage=!messagesPerField.existsError('username','password')
    displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??;
    section>

  <#-- ===================== ESTILOS (puedes moverlos a un .css) ===================== -->
  <#if section == "header">
    <style>
      /* === Paleta base Probabilidad === */
      :root{
        --kc-primary: #0A84FF;   /* azul principal (botón primario) */
        --kc-accent:  #FFC857;   /* dorado/acento */
        --kc-bg:      #0F172A;   /* fondo oscuro (slate-900) */
        --kc-text:    #FFFFFF;   /* texto principal */
        --kc-secondary:#1E293B;  /* gris-azulado oscuro para secundarios */
      }

      /* Fondo general */
      body, .login-pf, .kc-body{
        background: radial-gradient(circle at 50% -20%, #102039 0%, var(--kc-bg) 60%, #0b1222 100%);
        color: var(--kc-text);
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

      /* Centrado del card */
      .login-pf-page, .login-pf-page .login-pf-page-container{
        display:flex; align-items:center; justify-content:center;
        min-height:100vh;
        padding:96px 16px 24px;
      }

      /* Card */
      .pf-v5-c-card, .card-pf{
        background:#0b1324; border-radius:14px; border:1px solid #12203a;
        box-shadow:0 18px 70px rgba(0,0,0,.45);
        width:100%; max-width:440px; padding:24px 22px 28px !important; color:var(--kc-text);
        animation:fadeIn .45s ease-out both;
      }
      @keyframes fadeIn{from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none}}

      /* Títulos */
      h1, h2, h3, .pf-v5-c-title{
        color:var(--kc-accent);
        font-weight:700; text-align:center; margin:0 0 1.25rem;
      }

      /* Subtítulo “Sign In” debajo del header */
      .kc-subtitle{
        text-align:center; color:var(--kc-text); margin-top:72px;
        font-size:1.2rem; letter-spacing:.05em; font-weight:500;
      }

      /* Labels / inputs */
      label{
        font-size:.9rem; color:#e9eef9; display:block; margin:0 0 6px;
      }
      input[type="text"], input[type="email"], input[type="password"],
      .pf-v5-c-form-control, .form-control{
        width:100%;
        background:#0f1a31 !important;
        color:var(--kc-text) !important;
        border:1px solid #1f315a !important;
        border-radius:10px !important;
        padding:12px 14px !important;
        transition:border-color .25s ease, box-shadow .25s ease;
      }
      input:focus{
        outline:none;
        border-color:var(--kc-accent) !important;
        box-shadow:0 0 0 3px rgba(255,200,87,.18);
      }

      /* Grupo de password con botón ojo */
      .input-password{ position:relative; }
      .input-password input{
        width:100%; background:#0f1a31; color:var(--kc-text);
        border:1px solid #1f315a; border-radius:10px;
        padding:12px 44px 12px 14px; transition:border-color .25s ease;
      }
      .input-password input:focus{
        border-color:var(--kc-accent);
        box-shadow:0 0 0 3px rgba(255,200,87,.18);
      }
      .input-password button.toggle{
        position:absolute; right:8px; top:50%; transform:translateY(-50%);
        background:transparent; border:none; color:#c9d6ff; width:34px; height:34px;
        cursor:pointer; border-radius:8px; display:flex; align-items:center; justify-content:center;
        transition: background .2s ease, color .2s ease;
      }
      .input-password button.toggle:hover{ background:#152245; }

      /* Icono del ojo (estados) */
      .input-password button.toggle i,
      .input-password button.toggle i.fa-eye,
      .input-password button.toggle i.fa-eye-slash{
        color: var(--kc-accent) !important; transition: color .2s ease, transform .2s ease;
      }
      .input-password button.toggle:hover i{ color:#fff !important; transform:scale(1.08); }
      .input-password button.toggle.active i,
      .input-password button.toggle[aria-pressed="true"] i,
      .input-password button.toggle[data-visible="true"] i{
        color: var(--kc-primary) !important; /* azul cuando está visible */
      }
      .input-password button.toggle:active{ background:#0f1f44; }
      .input-password button.toggle:focus i,
      .input-password button.toggle:active i{ color:inherit !important; }

      /* Botón primario (azul) + hover (dorado) */
      .pf-v5-c-button.pf-m-primary,
      .btn.btn-primary,
      #kc-login{
        width:100%;
        background:var(--kc-primary) !important;
        border:1px solid transparent !important;
        border-radius:10px !important;
        color:#f8fbff !important;
        font-weight:700; letter-spacing:.02em; padding:12px 14px;
        transition: transform .2s ease, background-color .2s ease, filter .15s ease;
      }
      .pf-v5-c-button.pf-m-primary:hover,
      .btn.btn-primary:hover, #kc-login:hover{
        background:var(--kc-accent) !important;
        color:#1a1a1a !important; transform:translateY(-1px);
      }

      /* Botones secundarios */
      .pf-v5-c-button, .btn{
        background:var(--kc-secondary); color:var(--kc-text);
        border-radius:10px; border:1px solid #1f315a;
      }
      .pf-v5-c-button:hover, .btn:hover{
        background:#162640; transform:translateY(-1px);
      }

      /* Links */
      a{ color:var(--kc-accent); font-weight:500; text-decoration:none; }
      a:hover{ text-decoration:underline; }

      /* Alertas */
      .pf-v5-c-alert, .alert{
        background:#11253e; border-left:4px solid var(--kc-primary);
        color:#cfe6ff; border-radius:10px; padding:10px 12px;
      }

      /* Divider + Social */
      .auth-divider{
        display:flex; align-items:center; gap:12px; margin:16px 0 10px;
        color:#a9bbda; font-size:.9rem;
      }
      .auth-divider::before, .auth-divider::after{
        content:""; flex:1; height:1px; background:#1b2e53;
      }

      /* Contenedor social en columna */
      #kc-social-providers{
        display:grid; grid-template-columns:1fr; gap:10px; margin-top:.6rem;
      }
      #kc-social-providers ul{
        list-style:none; margin:0; padding:0; display:grid; grid-template-columns:1fr; gap:10px;
      }
      #kc-social-providers li{ margin:0; }
      #kc-social-providers a{
        width:100%; background:var(--kc-accent) !important; color:#222 !important;
        border:none !important; border-radius:10px !important; font-weight:700;
        display:flex !important; align-items:center; justify-content:center; gap:10px;
        padding:10px 12px !important; text-decoration:none !important; transition: filter .2s ease;
      }
      #kc-social-providers a:hover{ filter:brightness(1.08); }
      #kc-social-providers .kc-social-icon-text{ color:inherit !important; font-weight:700; }

      /* Footer */
      .login-pf-page .login-pf-page-footer{
        text-align:center; color:#c1d1f1; margin-top:1.2rem;
      }

      /* Compatibilidad PatternFly */
      #kc-form .pf-v5-c-input-group{ align-items:center; }
      #kc-form .pf-v5-c-input-group > input, #password{
        padding-right:42px !important; background:#0f1a31 !important;
      }

      /* Oculta el header viejo de KC, por si aparece */
      #kc-header{ display:none !important; }

      /* ===== Register: botón primario (azul) + hover dorado ===== */
      #kc-register-form input[type="submit"],
      #kc-register-form button[type="submit"],
      #kc-register-form .pf-v5-c-button.pf-m-primary,
      #kc-register-form .btn.btn-primary{
        width:100%; background:var(--kc-primary) !important; border:1px solid transparent !important;
        border-radius:10px !important; color:#f8fbff !important; font-weight:700; letter-spacing:.02em;
        padding:12px 14px; transition: transform .2s ease, background-color .2s ease;
      }
      #kc-register-form input[type="submit"]:hover,
      #kc-register-form button[type="submit"]:hover,
      #kc-register-form .pf-v5-c-button.pf-m-primary:hover,
      #kc-register-form .btn.btn-primary:hover{
        background:var(--kc-accent) !important; color:#1a1a1a !important; transform:translateY(-1px);
      }
      #kc-register-form .pf-v5-c-button.pf-m-primary.pf-m-control{
        background:var(--kc-primary) !important; color:#f8fbff !important;
      }

      /* Asegura alineación del subtítulo */
      #kc-content .kc-subtitle{ text-align:center; }
    </style>

    <header class="kc-header">
      <div class="logo">P</div><span>probabilidad</span>
    </header>
    <h2 class="kc-subtitle">Sign In</h2>
  <#-- =================== FIN ESTILOS & HEADER =================== -->

  <#elseif section == "form">
    <div id="kc-form">
      <div id="kc-form-wrapper">
        <#if realm.password>
          <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

            <#if !usernameHidden??>
              <div class="${properties.kcFormGroupClass!}">
                <label for="username" class="${properties.kcLabelClass!}">
                  <#if !realm.loginWithEmailAllowed>
                    ${msg("username")}
                  <#elseif !realm.registrationEmailAsUsername>
                    ${msg("usernameOrEmail")}
                  <#else>
                    ${msg("email")}
                  </#if>
                </label>

                <input tabindex="2" id="username" class="${properties.kcInputClass!}" name="username"
                       value="${(login.username!'')}" type="text" autofocus autocomplete="username"
                       aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" dir="ltr"/>

                <#if messagesPerField.existsError('username','password')>
                  <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                    ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                  </span>
                </#if>
              </div>
            </#if>

            <div class="${properties.kcFormGroupClass!}">
              <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>

              <div class="input-password">
                <input tabindex="3" id="password" name="password" type="password"
                       class="${properties.kcInputClass!}" autocomplete="current-password"
                       aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"/>

                <button type="button" class="toggle" aria-label="${msg('showPassword')}"
                        aria-controls="password" data-password-toggle>
                  <i class="fa fa-eye" aria-hidden="true"></i>
                </button>
              </div>

              <#if usernameHidden?? && messagesPerField.existsError('username','password')>
                <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                </span>
              </#if>
            </div>

            <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
              <div id="kc-form-options">
                <#if realm.rememberMe && !usernameHidden??>
                  <div class="checkbox">
                    <label>
                      <#if login.rememberMe??>
                        <input tabindex="5" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                      <#else>
                        <input tabindex="5" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
                      </#if>
                    </label>
                  </div>
                </#if>
              </div>

              <div class="${properties.kcFormOptionsWrapperClass!}">
                <#if realm.resetPasswordAllowed>
                  <span><a tabindex="6" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a></span>
                </#if>
              </div>
            </div>

            <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}">
              <input type="hidden" id="id-hidden-input" name="credentialId"
                     <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
              <input tabindex="7"
                     class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                     name="login" id="kc-login" type="submit" value="${msg("doLogIn")}"/>
            </div>

          </form>
        </#if>
      </div>
    </div>

    <script>
      (function () {
        const wrap = document.querySelector('.input-password');
        if (!wrap) return;
        const btn = wrap.querySelector('button.toggle');
        const input = wrap.querySelector('input#password');
        if (!btn || !input) return;

        function setState(show){
          input.type = show ? 'text' : 'password';
          btn.classList.toggle('active', show);
          btn.setAttribute('aria-pressed', String(show));
          btn.dataset.visible = show ? 'true' : 'false';

          const icon = btn.querySelector('i, svg, span');
          if (icon && icon.classList.contains('fa')){
            icon.classList.toggle('fa-eye', !show);
            icon.classList.toggle('fa-eye-slash', show);
          }
        }

        btn.addEventListener('click', () => setState(input.type !== 'text'));
      })();
    </script>

  <#elseif section == "info">
    <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
      <div id="kc-registration-container">
        <div id="kc-registration">
          <span>${msg("noAccount")}
            <a tabindex="8" href="${url.registrationUrl}">${msg("doRegister")}</a>
          </span>
        </div>
      </div>
    </#if>

  <#elseif section == "socialProviders">
    <#if realm.password && social?? && social.providers?has_content>
      <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
        <div class="auth-divider"><span>${msg("identity-provider-login-label")}</span></div>

        <ul class="${properties.kcFormSocialAccountListClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountListGridClass!}</#if>">
          <#list social.providers as p>
            <li>
              <a id="social-${p.alias}"
                 class="${properties.kcFormSocialAccountListButtonClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountGridItem!}</#if>"
                 type="button" href="${p.loginUrl}">
                <#if p.iconClasses?has_content>
                  <i class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" aria-hidden="true"></i>
                  <span class="${properties.kcFormSocialAccountNameClass!} kc-social-icon-text">${p.displayName!}</span>
                <#else>
                  <span class="${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                </#if>
              </a>
            </li>
          </#list>
        </ul>
      </div>
    </#if>
  </#if>

</@layout.registrationLayout>
