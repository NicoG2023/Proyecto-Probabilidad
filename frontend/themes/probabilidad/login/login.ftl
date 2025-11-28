<#-- login.ftl - Tema Probabilidad (Keycloak 26+) -->
<#import "template.ftl" as layout>

<@layout.registrationLayout
    displayMessage=!messagesPerField.existsError('username','password')
    displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??;
    section>

  <#-- ===================== ESTILOS (puedes moverlos a un .css) ===================== -->
  <#if section == "header">
<style>
  /* === PALETA DE COLORES ACTUALIZADA === */
  :root{
    /* Colores principales */
    --kc-primary:     #60A5FA;  /* Azul claro vibrante */
    --kc-primary-dark:#3B82F6;  /* Hover */
    --kc-accent:      #DBEAFE;  /* Azul muy claro / destacado */

    /* Sistema de grises */
    --kc-text-main:   #1F2937;  /* Texto principal */
    --kc-text-sec:    #6B7280;  /* Texto secundario */
    --kc-border:      #E5E7EB;  /* Borde muy claro */
    --kc-surface:     #F9FAFB;  /* Fondo alternativo (cards) */
    --kc-white:       #FFFFFF;

    /* Fondo general login (tema oscuro elegante) */
    --kc-bg:          #0F172A;
    --kc-bg-soft:     #1E293B;
  }

  /* Fondo general */
  body, .login-pf, .kc-body{
    background: var(--kc-white) !important;
    color: var(--kc-text-main);
    font-family: Inter, Segoe UI, system-ui, -apple-system, Arial, sans-serif;
  }

  /* Header/logo */
  .kc-header{
    position: fixed; top: 24px; left: 0; right: 0;
    display:flex; justify-content:center; align-items:center; gap:.6rem;
    color: var(--kc-accent);
    font-weight:700; text-transform: uppercase;
    letter-spacing:.12em;
  }
  .kc-header .logo{
    width: 28px; height: 28px;
    background: linear-gradient(135deg, var(--kc-primary), var(--kc-primary-dark));
    border-radius: 6px;
    display:flex; justify-content:center; align-items:center;
    color:#fff; font-weight:900;
  }

  /* CENTRAR CARD */
  .login-pf-page, .login-pf-page .login-pf-page-container{
    display:flex; align-items:center; justify-content:center;
    min-height:100vh; padding:100px 16px 32px;
  }

  /* CARD */
  .pf-v5-c-card, .card-pf{
    background: var(--kc-bg-soft);
    border-radius: 14px;
    border:1px solid var(--kc-border);
    box-shadow: 0 18px 70px rgba(0,0,0,.55);
    padding:26px 22px;
    width: 100%; max-width: 440px;
    color: var(--kc-white);
  }

  /* TITULOS */
  h1,h2,h3,.pf-v5-c-title{
    color: var(--kc-primary);
    text-align:center;
  }

  /* SUBTÍTULO */
  .kc-subtitle{
    color: var(--kc-accent);
    text-align:center;
    font-size:1.2rem;
    margin-top:70px;
  }

  /* LABELS */
  label{
    color: var(--kc-accent);
    font-size:.9rem;
  }

  /* INPUTS */
  input[type="text"], input[type="email"], input[type="password"]{
    width:100%;
    background:#0f1a31 !important;
    color: var(--kc-white) !important;
    border:1px solid #243a65 !important;
    border-radius:10px !important;
    padding:12px 14px !important;
    transition: all .25s ease;
  }
  input:focus{
    border-color: var(--kc-primary);
    box-shadow: 0 0 0 3px rgba(96,165,250,.25);
    outline:none;
  }

  /* PASSWORD TOGGLE */
  .input-password{
    position:relative;
  }
  .input-password button.toggle i{
    color: var(--kc-primary);
  }

  /* BOTÓN PRINCIPAL */
  #kc-login{
    width:100%;
    background: var(--kc-primary) !important;
    border-radius:10px !important;
    color: var(--kc-white) !important;
    font-weight:700;
    padding:12px;
    transition: all .2s ease;
  }
  #kc-login:hover{
    background: var(--kc-primary-dark) !important;
    transform: translateY(-2px);
  }

  /* LINKS */
  a{
    color: var(--kc-accent);
  }
  a:hover{ text-decoration: underline; }

  /* ALERTAS */
  .pf-v5-c-alert, .alert{
    background:#11253e;
    border-left:4px solid var(--kc-primary);
    color:#cfe6ff;
    border-radius:10px;
  }

  /* REGISTRO */
  #kc-register-form button[type="submit"]{
    background: var(--kc-primary);
  }
  #kc-register-form button[type="submit"]:hover{
    background: var(--kc-primary-dark);
  }
</style>

<header class="kc-header">
  <div class="logo">P</div>
  <span>probabilidad</span>
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
