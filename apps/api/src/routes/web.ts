import type { FastifyInstance } from 'fastify'

export async function webRoutes(app: FastifyInstance) {

  app.get('/app', async (_request, reply) => {
    const __orHelper = '<scr' + 'ipt>\nfunction _or(a,b){return a?a:b}\n';
    const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FamilyCart</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    :root{--c-primary:#6C5CE7;--c-primary-dark:#5A4BD1;--c-primary-light:#F0EDFF;--c-pink:#E84393;--c-coral:#FF6B6B;--c-orange:#FF922B;--c-gold:#FDCB6E;--c-green:#00B894;--c-cyan:#00CEC9;--c-blue:#0984E3;--c-blue-light:#E0F0FF;--c-amber:#FF922B;--c-danger:#FF6B6B;--c-danger-light:#FFE8E8;--c-bg:#F0EDFF;--c-card:rgba(255,255,255,.65);--c-card-solid:#FFFFFF;--c-bg2:rgba(255,255,255,.45);--c-border:rgba(255,255,255,.4);--c-border2:rgba(108,92,231,.12);--c-text:#1A1A2E;--c-text2:#7C7C95;--c-text3:#94A3B8;--radius-sm:10px;--radius-md:14px;--radius-lg:20px;--radius-xl:28px;--shadow-sm:0 2px 8px rgba(108,92,231,.06);--shadow-md:0 4px 16px rgba(108,92,231,.1);--shadow-lg:0 8px 24px rgba(108,92,231,.15);--shadow-glow:0 4px 16px rgba(108,92,231,.3);--glass-blur:blur(20px)}
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
    body{font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--c-bg);min-height:100vh;color:var(--c-text);-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#6C5CE7,#E84393);border-radius:4px}
    /* ANIMATIONS */
    @keyframes gradMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes float1{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-14px) rotate(6deg)}50%{transform:translateY(-4px) rotate(-4deg)}75%{transform:translateY(-18px) rotate(5deg)}}
    @keyframes float2{0%,100%{transform:translateY(0) rotate(0deg)}33%{transform:translateY(-20px) rotate(-8deg)}66%{transform:translateY(-6px) rotate(6deg)}}
    @keyframes float3{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-22px) scale(1.08)}}
    @keyframes blob1{0%,100%{transform:translate(0,0) scale(1) rotate(0)}25%{transform:translate(80px,-60px) scale(1.2) rotate(90deg)}50%{transform:translate(-50px,-90px) scale(.85) rotate(180deg)}75%{transform:translate(60px,-30px) scale(1.1) rotate(270deg)}}
    @keyframes blob2{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(-70px,50px) scale(1.15)}50%{transform:translate(40px,80px) scale(.9)}75%{transform:translate(-60px,20px) scale(1.1)}}
    @keyframes glow{0%,100%{box-shadow:0 0 10px rgba(108,92,231,.2)}50%{box-shadow:0 0 25px rgba(108,92,231,.4)}}
    @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
    @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
    /* BACKGROUND */
    .bg-effects{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
    .blob{position:absolute;border-radius:50%;filter:blur(60px);opacity:.18}
    /* NAV */
    nav{background:linear-gradient(135deg,#6C5CE7 0%,#E84393 30%,#FF6B6B 55%,#FF922B 75%,#FDCB6E 100%);background-size:300% 300%;animation:gradMove 8s ease infinite;color:#fff;padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:10;box-shadow:0 4px 20px rgba(108,92,231,.25)}
    nav h1{font-size:20px;font-weight:900;letter-spacing:-.3px}
    #userBadge{font-size:13px;opacity:.9;font-weight:500}
    #logoutBtn{padding:7px 16px;border:1.5px solid rgba(255,255,255,.35);border-radius:var(--radius-sm);background:rgba(255,255,255,.15);color:#fff;cursor:pointer;font-size:13px;font-weight:600;backdrop-filter:blur(8px);transition:all .3s}
    #logoutBtn:hover{background:rgba(255,255,255,.25);border-color:rgba(255,255,255,.5);transform:translateY(-1px)}
    /* TABS */
    .tabs{display:flex;gap:6px;padding:24px 32px 0;max-width:1140px;margin:0 auto}
    .tab{padding:11px 22px;border-radius:var(--radius-sm) var(--radius-sm) 0 0;background:var(--c-card);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);border:1px solid var(--c-border);border-bottom:none;cursor:pointer;font-size:14px;font-weight:600;color:var(--c-text2);transition:all .3s}
    .tab:hover{color:var(--c-primary);background:rgba(108,92,231,.06)}
    .tab.active{background:var(--c-card);color:var(--c-primary);border-bottom:3px solid var(--c-card-solid);font-weight:700;box-shadow:var(--shadow-sm)}
    .admin-only{display:none}
    body.is-admin .admin-only.tab{display:block}
    body.is-admin .panel.admin-only.active{display:block}
    .super-only{display:none}
    body.is-super-admin .super-only{display:block}
    body.is-super-admin .super-only.tab{display:block}
    body.is-super-admin .panel.super-only.active{display:block}
    #familySelector{display:none;margin:16px 32px 0;max-width:1140px;margin-left:auto;margin-right:auto}
    body.is-super-admin #familySelector{display:flex;align-items:center;gap:10px}
    #familySelector label{margin:0;font-size:13px;font-weight:700;color:var(--c-text2);text-transform:uppercase;letter-spacing:.5px}
    #familySelector select{width:auto;min-width:200px;padding:8px 12px;font-size:13px}
    /* CONTENT */
    .content{max-width:1140px;margin:0 auto;padding:0 32px 48px;position:relative;z-index:1}
    .panel{background:var(--c-card);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);border-radius:0 var(--radius-md) var(--radius-md) var(--radius-md);border:1px solid var(--c-border);padding:28px;display:none;box-shadow:var(--shadow-sm)}
    .panel.active{display:block;animation:fadeUp .4s ease}
    /* CARDS */
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;margin-top:20px}
    .card{background:var(--c-card);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:20px;cursor:pointer;transition:all .35s cubic-bezier(.34,1.56,.64,1);box-shadow:var(--shadow-sm);position:relative;overflow:hidden;animation:fadeUp .4s ease both}
    .card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#6C5CE7,#E84393,#FF6B6B);opacity:0;transition:opacity .3s}
    .card:hover{box-shadow:var(--shadow-md);transform:translateY(-4px) scale(1.01);border-color:rgba(108,92,231,.15)}
    .card:hover::before{opacity:1}
    .card h3{font-size:16px;font-weight:700;margin-bottom:8px;letter-spacing:-.2px}
    .card .meta{font-size:12px;color:var(--c-text2);font-weight:500}
    .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.3px}
    .badge-active{background:#E8DFFF;color:#6C5CE7}
    .badge-completed{background:var(--c-bg2);color:var(--c-text2)}
    .badge-groceries{background:#FFF0DB;color:#FF922B}
    .badge-household{background:#E0F0FF;color:#0984E3}
    .badge-personal{background:#FCE7F3;color:#E84393}
    .badge-pharmacy{background:#E0FFF6;color:#00B894}
    .badge-other{background:var(--c-bg2);color:#475569}
    /* TOOLBAR */
    .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .toolbar h2{font-size:20px;font-weight:900;letter-spacing:-.3px}
    /* BUTTONS */
    .btn{padding:10px 18px;border-radius:var(--radius-sm);border:0;cursor:pointer;font-size:13px;font-weight:700;transition:all .3s cubic-bezier(.34,1.56,.64,1);letter-spacing:.2px}
    .btn-primary{background:linear-gradient(135deg,#6C5CE7,#E84393);color:#fff;box-shadow:var(--shadow-glow)}
    .btn-primary:hover{box-shadow:0 6px 24px rgba(108,92,231,.4);transform:translateY(-2px)}
    .btn-whatsapp{background:linear-gradient(135deg,#25D366,#1DA851);color:#fff;box-shadow:0 4px 12px rgba(37,211,102,.25)}
    .btn-whatsapp:hover{box-shadow:0 6px 20px rgba(37,211,102,.35);transform:translateY(-1px)}
    .btn-danger{background:var(--c-danger-light);color:#B91C1C;border:1.5px solid #FECACA}
    .btn-danger:hover{background:#FEE2E2}
    .btn-light{background:var(--c-bg2);backdrop-filter:var(--glass-blur);color:var(--c-text);border:1.5px solid var(--c-border2);font-weight:600}
    .btn-light:hover{background:rgba(108,92,231,.08)}
    .btn:active{transform:scale(.96)}
    .wa-inline-select{min-width:230px;padding:10px 14px;border:1.5px solid var(--c-border2);border-radius:var(--radius-sm);background:var(--c-card);font-size:13px;font-weight:500}
    /* MODAL */
    .overlay{display:none;position:fixed;inset:0;background:rgba(26,26,46,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:100;align-items:center;justify-content:center}
    .overlay.open{display:flex}
    .modal{background:rgba(255,255,255,.88);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:var(--radius-xl);padding:28px;width:100%;max-width:460px;box-shadow:0 24px 80px rgba(108,92,231,.15);border:1px solid rgba(255,255,255,.5);animation:popIn .35s ease}
    .modal h3{margin-bottom:20px;font-size:18px;font-weight:900;letter-spacing:-.3px}
    label{display:block;margin:12px 0 5px;font-size:12px;color:var(--c-text2);font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    input,select,textarea{width:100%;padding:11px 14px;border:1.5px solid var(--c-border2);border-radius:var(--radius-sm);font-size:14px;background:rgba(255,255,255,.6);font-weight:500;transition:all .3s;font-family:inherit}
    input:focus,select:focus,textarea:focus{outline:none;border-color:var(--c-primary);box-shadow:0 0 0 4px rgba(108,92,231,.12);background:rgba(255,255,255,.9)}
    .modal-footer{display:flex;gap:10px;justify-content:flex-end;margin-top:20px;position:sticky;bottom:-28px;background:rgba(255,255,255,.88);padding:14px 0 4px;border-top:1px solid var(--c-border)}
    /* ITEMS */
    .item-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--c-border);transition:background .2s}
    .item-row:hover{background:rgba(108,92,231,.03);border-radius:8px}
    .item-row:last-child{border-bottom:none}
    .item-check{width:20px;height:20px;cursor:pointer;accent-color:var(--c-primary);border-radius:4px}
    .item-name{flex:1;font-size:14px;font-weight:500}
    .item-name.done{text-decoration:line-through;color:var(--c-text3)}
    .item-qty{font-size:12px;color:var(--c-text2);min-width:48px;text-align:right;font-weight:600}
    .item-del{background:none;border:none;cursor:pointer;color:var(--c-text3);font-size:16px;padding:4px;line-height:1;transition:all .2s;border-radius:6px}
    .item-del:hover{color:var(--c-danger);background:var(--c-danger-light)}
    /* BACK */
    .back{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--c-primary);cursor:pointer;margin-bottom:18px;font-weight:600;transition:all .2s}
    .back:hover{opacity:.7;transform:translateX(-3px)}
    /* EMPTY */
    .empty{padding:48px;text-align:center;color:var(--c-text3);font-size:14px;font-weight:500}
    /* TOAST */
    #toast{position:fixed;bottom:28px;right:28px;background:linear-gradient(135deg,rgba(108,92,231,.92),rgba(232,67,147,.88));backdrop-filter:blur(16px);color:#fff;padding:14px 22px;border-radius:var(--radius-md);font-size:13px;font-weight:700;display:none;z-index:999;box-shadow:0 16px 48px rgba(108,92,231,.35);border:1px solid rgba(255,255,255,.15)}
    /* LIGHTBOX */
    #lightbox{display:none;position:fixed;inset:0;background:rgba(26,26,46,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:200;align-items:center;justify-content:center;cursor:zoom-out}
    #lightbox.open{display:flex}
    #lightbox img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:var(--radius-md);box-shadow:0 8px 40px rgba(0,0,0,.5)}
    #lightbox .lb-close{position:fixed;top:20px;right:24px;background:rgba(255,255,255,.12);border:none;color:#fff;font-size:28px;width:48px;height:48px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);transition:background .2s}
    #lightbox .lb-close:hover{background:rgba(255,255,255,.25)}
    #lightbox .lb-title{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);color:#fff;font-size:14px;font-weight:600;background:rgba(26,26,46,.6);padding:8px 20px;border-radius:999px;backdrop-filter:blur(8px);max-width:80vw;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    /* RTL */
    html[dir=rtl] .tabs{direction:rtl}
    html[dir=rtl] .back{flex-direction:row-reverse}
    html[dir=rtl] .item-row{flex-direction:row-reverse}
    html[dir=rtl] .toolbar{flex-direction:row-reverse}
    html[dir=rtl] .modal-footer{flex-direction:row-reverse}
    html[dir=rtl] th{text-align:right}
    html[dir=rtl] .item-qty{text-align:left}
    html[dir=rtl] body{direction:rtl;text-align:right}
    html[dir=rtl] nav{flex-direction:row-reverse}
    html[dir=rtl] .wa-phone-link{flex-direction:row-reverse}
    html[dir=rtl] .member-check-row{flex-direction:row-reverse}
    html[dir=rtl] #toast{right:auto;left:28px}
    /* QR MODAL */
    .qr-modal-body{display:flex;flex-direction:column;align-items:center;gap:18px;padding:16px 0}
    .qr-modal-body canvas{border:8px solid #fff;border-radius:var(--radius-lg);box-shadow:var(--shadow-md)}
    .qr-member-name{font-size:18px;font-weight:900;color:var(--c-text);text-align:center;letter-spacing:-.2px}
    .qr-member-login{font-size:14px;color:var(--c-text2);text-align:center;word-break:break-all;font-weight:500}
    .qr-hint{font-size:12px;color:var(--c-text3);text-align:center;margin-top:4px;line-height:1.6}
    .btn-qr{background:var(--c-primary-light);color:var(--c-primary);border:1.5px solid rgba(108,92,231,.2);font-size:12px;padding:7px 12px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:4px;transition:all .2s}
    .btn-qr:hover{background:rgba(108,92,231,.1);box-shadow:var(--shadow-sm)}
    /* LANG SELECTOR */
    #langSelect{padding:5px 10px;border:1.5px solid rgba(255,255,255,.3);border-radius:var(--radius-sm);background:rgba(255,255,255,.15);color:#fff;cursor:pointer;font-size:12px;font-weight:700;backdrop-filter:blur(8px)}
    #langSelect option{background:var(--c-primary-dark);color:#fff}
    /* TABLE */
    table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}
    th{text-align:left;padding:10px 14px;border-bottom:2px solid var(--c-border2);color:var(--c-text2);font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.5px}
    td{padding:12px 14px;border-bottom:1px solid var(--c-border)}
    tr:hover td{background:rgba(108,92,231,.03)}
    .amount{font-weight:700;color:var(--c-primary)}
    /* LOADING */
    .loading{padding:40px;text-align:center;color:var(--c-text3);font-weight:500}
    /* CATEGORY PICKER */
    .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0}
    .cat-chip{display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 10px;border:2px solid var(--c-border2);border-radius:var(--radius-md);cursor:pointer;background:rgba(255,255,255,.5);backdrop-filter:blur(12px);transition:all .3s cubic-bezier(.34,1.56,.64,1);font-size:12px;font-weight:700;color:#475569}
    .cat-chip:hover{border-color:var(--c-primary);background:rgba(108,92,231,.06);color:var(--c-primary);transform:translateY(-2px) scale(1.02)}
    .cat-chip.selected{border-color:var(--c-primary);background:var(--c-primary-light);color:var(--c-primary);box-shadow:var(--shadow-glow)}
    .cat-chip .icon{font-size:24px}
    .cat-custom{margin-top:6px}
    /* Compact category chips inside edit modal */
    #editCatGrid{grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0}
    #editCatGrid .cat-chip{padding:8px 5px;font-size:10px;gap:3px}
    #editCatGrid .cat-chip .icon{font-size:18px}
    /* STEP INDICATOR */
    .steps{display:flex;gap:10px;margin-bottom:20px;align-items:center}
    .step{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;transition:all .3s}
    .step.done{background:linear-gradient(135deg,#6C5CE7,#E84393);color:#fff;box-shadow:var(--shadow-glow)}
    .step.active{background:linear-gradient(135deg,#6C5CE7,#E84393);color:#fff;box-shadow:var(--shadow-glow);animation:breathe 2s ease-in-out infinite}
    .step.pending{background:var(--c-bg2);color:var(--c-text3)}
    .step-line{flex:1;height:3px;background:var(--c-bg2);border-radius:2px}
    .step-line.done{background:linear-gradient(90deg,#6C5CE7,#E84393)}
    /* ITEM CATEGORY BADGE */
    .item-cat{font-size:10px;padding:3px 8px;border-radius:999px;background:var(--c-bg2);color:var(--c-text2);font-weight:700;white-space:nowrap}
    /* WHATSAPP MEMBER ROW */
    .member-check-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--c-border);cursor:pointer;transition:background .15s;border-radius:8px;padding-left:8px;padding-right:8px}
    .member-check-row:hover{background:rgba(108,92,231,.03)}
    .member-check-row:last-child{border-bottom:none}
    .member-check-row input[type=checkbox]{width:18px;height:18px;accent-color:#25D366;cursor:pointer;flex-shrink:0}
    .wa-preview{background:rgba(240,253,244,.7);border:1.5px solid #BBF7D0;border-radius:var(--radius-md);padding:16px;font-size:12px;font-family:'SF Mono',ui-monospace,monospace;white-space:pre-wrap;word-break:break-word;max-height:260px;overflow-y:auto;margin-top:12px;line-height:1.7;backdrop-filter:blur(8px)}
    .wa-send-row{display:flex;flex-direction:column;gap:10px;margin-top:16px}
    .wa-phone-link{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(240,253,244,.7);border:1.5px solid #BBF7D0;border-radius:var(--radius-sm);font-size:13px;font-weight:500}
    .wa-phone-link a{color:#16A34A;font-weight:700;text-decoration:none}
    .wa-phone-link a:hover{text-decoration:underline}
    /* WA CONFIG PAGE */
    .wa-group-card{background:var(--c-card);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);border:1.5px solid var(--c-border);border-radius:var(--radius-lg);padding:20px;margin-bottom:14px;transition:all .3s cubic-bezier(.34,1.56,.64,1);box-shadow:var(--shadow-sm)}
    .wa-group-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
    .wa-group-card h4{font-size:15px;font-weight:900;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;letter-spacing:-.2px}
    .wa-group-members{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
    .wa-member-pill{background:var(--c-primary-light);border:1.5px solid rgba(108,92,231,.2);color:var(--c-primary);border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600}
    .wa-group-actions{display:flex;gap:10px;margin-top:12px}
    .wa-group-empty{padding:56px 28px;text-align:center;color:var(--c-text3);font-size:14px;line-height:2;font-weight:500}
    .section-info{font-size:13px;color:var(--c-text2);margin-bottom:20px;padding:14px 18px;background:rgba(255,255,255,.5);backdrop-filter:blur(12px);border-radius:var(--radius-md);border:1.5px solid var(--c-border);line-height:1.7;font-weight:500}
  </style>
</head>
<body>

<!-- Animated background blobs -->
<div class="bg-effects">
  <div class="blob" style="width:350px;height:350px;left:5%;top:8%;background:radial-gradient(circle,rgba(108,92,231,.3),transparent 65%);animation:blob1 18s ease-in-out infinite"></div>
  <div class="blob" style="width:300px;height:300px;right:5%;top:5%;background:radial-gradient(circle,rgba(232,67,147,.25),transparent 65%);animation:blob2 22s ease-in-out infinite"></div>
  <div class="blob" style="width:280px;height:280px;left:40%;bottom:10%;background:radial-gradient(circle,rgba(255,107,107,.22),transparent 65%);animation:blob1 20s ease-in-out 3s infinite"></div>
  <div class="blob" style="width:320px;height:320px;right:20%;bottom:30%;background:radial-gradient(circle,rgba(0,184,148,.22),transparent 65%);animation:blob2 24s ease-in-out 5s infinite"></div>
  <div class="blob" style="width:240px;height:240px;left:25%;top:50%;background:radial-gradient(circle,rgba(253,203,110,.2),transparent 65%);animation:blob1 26s ease-in-out 2s infinite"></div>
</div>

<nav>
  <h1>&#127868; FamilyCart</h1>
  <span id="welcomeBanner" style="font-size:15px;color:#fff;font-weight:600"></span>
  <div style="display:flex;align-items:center;gap:16px">
    <select id="langSelect"><option value="en">EN</option><option value="he">עב</option></select>
    <span id="userBadge"></span>
    <button id="logoutBtn" data-t="logout">Logout</button>
  </div>
</nav>

<div class="tabs" id="mainTabs">
  <div class="tab active" data-tab="lists" data-t="tab_lists">🛒 Shopping Lists</div>
  <div class="tab admin-only" data-tab="expenses" data-t="tab_expenses">💸 Expenses</div>
  <div class="tab admin-only" data-tab="members" data-t="tab_members">👥 Members</div>
  <div class="tab admin-only" data-tab="whatsapp" data-t="tab_whatsapp">📱 WhatsApp Config</div>
  <div class="tab super-only" data-tab="families">🏠 Families</div>
  <div class="tab" data-tab="profile" data-t="tab_profile">👤 Profile</div>
</div>

<div id="familySelector">
  <label>Family:</label>
  <select id="familySelect" onchange="onFamilyFilterChange()">
    <option value="">All families</option>
  </select>
</div>

<div class="content">

  <!-- LISTS PANEL -->
  <div class="panel active" id="tab-lists">
    <div id="listsView">
      <div class="toolbar">
        <h2 data-t="shopping_lists">Shopping Lists</h2>
        <button class="btn btn-primary" id="newListBtn" data-t="new_list">+ New List</button>
      </div>
      <div id="listsGrid" class="grid"><div class="loading">Loading...</div></div>
    </div>
    <div id="listDetailView" style="display:none">
      <div class="back" id="backToLists" data-t="back_to_lists">← Back to lists</div>
      <div class="toolbar">
        <h2 id="listDetailTitle"></h2>
        <div style="display:flex;gap:8px">
          <select id="listWaGroupSelect" class="wa-inline-select">
            <option value="" data-t="select_wa_group">Select WhatsApp group...</option>
          </select>
          <button class="btn btn-whatsapp" id="sendWhatsappBtn" data-t="send_to_wa">📱 Send to WhatsApp</button>
          <button class="btn btn-primary" id="findStoresBtn" data-t="find_stores" style="background:#3b82f6">📍 Find Nearby Stores</button>
          <button class="btn btn-primary" id="addItemBtn" data-t="add_item">+ Add Item</button>
        </div>
      </div>
      <div id="itemsContainer"></div>
    </div>
  </div>

  <!-- EXPENSES PANEL -->
  <div class="panel admin-only" id="tab-expenses">
    <div class="toolbar">
      <h2 data-t="expenses">Expenses</h2>
      <button class="btn btn-primary" id="newExpenseBtn" data-t="add_expense">+ Add Expense</button>
    </div>
    <div id="expensesTable"><div class="loading">Loading...</div></div>
  </div>

  <!-- MEMBERS PANEL -->
  <div class="panel admin-only" id="tab-members">
    <div class="toolbar">
      <div>
        <h2 data-t="family_members">Family Members</h2>
        <p style="font-size:13px;color:#64748b;margin-top:4px;font-weight:400" data-t="members_desc">Create, view, update role, and remove members.</p>
      </div>
      <button class="btn btn-primary" id="inviteMemberBtn" data-t="invite_member">+ Invite Member</button>
    </div>
    <div id="membersTable"><div class="loading">Loading...</div></div>
  </div>

  <!-- WHATSAPP CONFIG PANEL -->
  <div class="panel admin-only" id="tab-whatsapp">
    <div class="toolbar">
      <div>
        <h2 data-t="wa_config">📱 WhatsApp Configuration</h2>
        <p style="font-size:13px;color:#64748b;margin-top:4px;font-weight:400" data-t="wa_config_desc">Manage your WhatsApp groups and settings for sending shopping lists.</p>
      </div>
      <button class="btn btn-whatsapp" id="newWaGroupBtn" data-t="new_group">+ New Group</button>
    </div>
    <div class="section-info">
      &#9432;&nbsp; <strong>How it works:</strong> Save one or more WhatsApp groups below, each with a name and the family members that belong to it. When you open a shopping list and click <em>Send to WhatsApp</em>, you pick a saved group — the app builds a formatted message and opens WhatsApp pre-addressed to each member's phone number.
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;margin-bottom:24px">
      <div style="background:linear-gradient(135deg,rgba(108,92,231,.06),rgba(240,237,255,.8));border:1.5px solid rgba(108,92,231,.15);border-radius:20px;padding:22px;transition:transform .2s;backdrop-filter:blur(12px)" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
        <div style="font-size:28px;margin-bottom:8px;width:48px;height:48px;background:#fff;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(108,92,231,.1)">&#128242;</div>
        <div style="font-size:14px;font-weight:800;margin-bottom:6px;color:#0F172A;letter-spacing:-.2px">1. Create a group</div>
        <div style="font-size:13px;color:#64748B;line-height:1.5">Give it a name and pick which family members are in it.</div>
      </div>
      <div style="background:linear-gradient(135deg,rgba(108,92,231,.06),rgba(240,237,255,.8));border:1.5px solid rgba(108,92,231,.15);border-radius:20px;padding:22px;transition:transform .2s;backdrop-filter:blur(12px)" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
        <div style="font-size:28px;margin-bottom:8px;width:48px;height:48px;background:#fff;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(108,92,231,.1)">&#128722;</div>
        <div style="font-size:14px;font-weight:800;margin-bottom:6px;color:#0F172A;letter-spacing:-.2px">2. Open a shopping list</div>
        <div style="font-size:13px;color:#64748B;line-height:1.5">Go to any list and click the green "Send to WhatsApp" button.</div>
      </div>
      <div style="background:linear-gradient(135deg,rgba(108,92,231,.06),rgba(240,237,255,.8));border:1.5px solid rgba(108,92,231,.15);border-radius:20px;padding:22px;transition:transform .2s;backdrop-filter:blur(12px)" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
        <div style="font-size:28px;margin-bottom:8px;width:48px;height:48px;background:#fff;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(108,92,231,.1)">&#128228;</div>
        <div style="font-size:14px;font-weight:800;margin-bottom:6px;color:#0F172A;letter-spacing:-.2px">3. Send the message</div>
        <div style="font-size:13px;color:#64748B;line-height:1.5">Pick your group, confirm recipients, preview and send via WhatsApp.</div>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 style="font-size:15px" data-t="saved_groups">Saved Groups</h3>
      <span id="waGroupCount" style="font-size:13px;color:#64748b"></span>
    </div>
    <div id="waGroupsList"><div class="loading">Loading...</div></div>
  </div>

  <!-- FAMILIES PANEL (super-admin only) -->
  <div class="panel super-only" id="tab-families">
    <div class="toolbar">
      <h2>All Families</h2>
      <button class="btn btn-primary" onclick="openModal('newFamilyModal')">+ New Family</button>
    </div>
    <div id="familiesGrid" class="grid"><div class="loading">Loading...</div></div>
  </div>

  <!-- NEW FAMILY MODAL -->
  <div class="overlay" id="newFamilyModal">
    <div class="modal">
      <h3>Create Family</h3>
      <label>Family name</label>
      <input id="newFamilyName" placeholder="e.g. The Levi Family" />
      <div class="modal-footer">
        <button class="btn btn-light" data-close="newFamilyModal">Cancel</button>
        <button class="btn btn-primary" id="createFamilyBtn">Create</button>
      </div>
    </div>
  </div>

  <!-- PROFILE PANEL -->
  <div class="panel" id="tab-profile">
    <div class="toolbar">
      <h2 data-t="profile_title">My Profile</h2>
    </div>
    <div style="max-width:480px">
      <div style="text-align:center;margin-bottom:24px">
        <div id="profileAvatar" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#6C5CE7,#E84393);display:inline-flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#fff;margin-bottom:10px;box-shadow:0 4px 16px rgba(108,92,231,.3)"></div>
        <div id="profileRoleBadge" style="font-size:12px;color:#6C5CE7;text-transform:uppercase;font-weight:700;background:#F0EDFF;padding:3px 12px;border-radius:999px;display:inline-block;letter-spacing:.5px"></div>
      </div>
      <label data-t="full_name_label">Full name</label>
      <input id="profileFullName" placeholder="Your name" />
      <label data-t="phone_label">Phone number</label>
      <input id="profilePhone" placeholder="+972 50 000 0000" />
      <label data-t="email_label">Email</label>
      <input id="profileEmail" type="email" placeholder="name@example.com" />
      <div style="margin-top:20px;display:flex;gap:8px">
        <button class="btn btn-primary" id="saveProfileBtn" data-t="save_profile">Save changes</button>
      </div>

      <hr style="margin:28px 0;border:none;border-top:1px solid #e2e8f0" />

      <h3 style="font-size:16px;font-weight:600;margin-bottom:16px" data-t="change_password_title">Change Password</h3>
      <label data-t="current_password_label">Current password</label>
      <input id="profileCurrentPw" type="password" placeholder="Enter current password" />
      <label data-t="new_password_label">New password</label>
      <input id="profileNewPw" type="password" placeholder="Min 8 characters" />
      <label data-t="confirm_password_label">Confirm new password</label>
      <input id="profileConfirmPw" type="password" placeholder="Repeat new password" />
      <div style="margin-top:20px;display:flex;gap:8px">
        <button class="btn btn-primary" id="changePasswordBtn" data-t="change_password_btn">Change Password</button>
      </div>
    </div>
  </div>

</div>

<!-- MODALS -->
<div class="overlay" id="newListModal">
  <div class="modal">
    <h3 data-t="create_list">Create Shopping List</h3>
    <label>List Name</label>
    <input id="newListName" placeholder="e.g. Weekly Groceries" />
    <div class="modal-footer">
      <button class="btn btn-light" data-close="newListModal">Cancel</button>
      <button class="btn btn-primary" id="createListBtn">Create</button>
    </div>
  </div>
</div>

<div class="overlay" id="editItemModal">
  <div class="modal" style="max-width:440px;max-height:90vh;overflow-y:auto">
    <h3 data-t="edit_item">Edit Item</h3>
    <input type="hidden" id="editItemId" />
    <label>Item Name <span style="color:#ef4444">*</span></label>
    <input id="editItemName" placeholder="e.g. Whole Milk" />
    <label>Quantity</label>
    <input id="editItemQty" type="number" value="1" min="1" />
    <label>Unit (optional)</label>
    <input id="editItemUnit" placeholder="e.g. kg, pcs, L" />
    <label>Estimated Price (optional)</label>
    <input id="editItemPrice" type="number" step="0.01" placeholder="0.00" />
    <label>Category (optional)</label>
    <div class="cat-grid" id="editCatGrid">
      <div class="cat-chip edit-cat-chip" data-cat="Produce"><span class="icon">&#x1F96C;</span><span data-t="cat_produce">Produce</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Dairy"><span class="icon">&#x1F9C0;</span><span data-t="cat_dairy">Dairy</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Meat"><span class="icon">&#x1F356;</span><span data-t="cat_meat">Meat</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Bakery"><span class="icon">&#x1F35E;</span><span data-t="cat_bakery">Bakery</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Frozen"><span class="icon">&#x2744;&#xFE0F;</span><span data-t="cat_frozen">Frozen</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Beverages"><span class="icon">&#x1F964;</span><span data-t="cat_beverages">Beverages</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Snacks"><span class="icon">&#x1F36F;</span><span data-t="cat_snacks">Snacks</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Cleaning"><span class="icon">&#x1F9F9;</span><span data-t="cat_cleaning">Cleaning</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Personal Care"><span class="icon">&#x1FAA5;</span><span data-t="cat_personal_care">Personal Care</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Baby"><span class="icon">&#x1F476;</span><span data-t="cat_baby">Baby</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Pharmacy"><span class="icon">&#x1F48A;</span><span data-t="cat_pharmacy">Pharmacy</span></div>
      <div class="cat-chip edit-cat-chip" data-cat="Other"><span class="icon">&#x1F4E6;</span><span data-t="cat_other">Other</span></div>
    </div>
    <input type="hidden" id="editItemCategory" />

    <label style="margin-top:12px">Current Images</label>
    <div id="editItemImages" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;min-height:40px">
      <span style="color:#94a3b8;font-size:13px">No images</span>
    </div>

    <label>Upload New Picture (optional)</label>
    <input id="editItemImage" type="file" accept="image/*" />
    <div style="margin-top:8px">
      <button class="btn btn-light" id="editAiFindImageBtn" type="button" style="display:inline-flex;align-items:center;gap:6px">
        <span>&#x1F50D;</span> Find Image by AI
      </button>
      <span id="editAiFindImageStatus" style="margin-left:8px;font-size:12px;color:#64748b"></span>
    </div>
    <div id="editAiImagePreview" style="display:none;margin-top:10px;text-align:center">
      <img id="editAiImagePreviewImg" style="max-height:120px;border-radius:8px;border:1px solid #e2e8f0;cursor:pointer" onclick="openLightbox(this.src, document.getElementById('editAiImagePreviewTitle').textContent)" title="Click to enlarge" />
      <div style="margin-top:4px;font-size:11px;color:#64748b">
        <span id="editAiImagePreviewTitle"></span> &middot; <span id="editAiImagePreviewSource"></span>
      </div>
      <div style="margin-top:6px">
        <button class="btn btn-primary" id="editAiImageUseBtn" type="button" style="font-size:12px;padding:5px 14px">Use this image</button>
        <button class="btn btn-light" id="editAiImageDiscardBtn" type="button" style="font-size:12px;padding:5px 14px;margin-left:4px">Discard</button>
      </div>
    </div>
    <input type="hidden" id="editAiImageUrl" value="" />
    <div class="modal-footer">
      <button class="btn btn-light" data-close="editItemModal">Cancel</button>
      <button class="btn btn-primary" id="updateItemBtn">Save Changes</button>
    </div>
  </div>
</div>

<div class="overlay" id="addItemModal">
  <div class="modal" style="max-width:480px">

    <!-- Step 1: Category -->
    <div id="itemStep1">
      <div class="steps">
        <div class="step active" id="s1dot">1</div>
        <div class="step-line" id="s1line"></div>
        <div class="step pending" id="s2dot">2</div>
      </div>
      <h3 data-t="what_category">What category is this item?</h3>
      <div class="cat-grid">
        <div class="cat-chip" data-cat="Produce"><span class="icon">&#x1F96C;</span><span data-t="cat_produce">Produce</span></div>
        <div class="cat-chip" data-cat="Dairy"><span class="icon">&#x1F9C0;</span><span data-t="cat_dairy">Dairy</span></div>
        <div class="cat-chip" data-cat="Meat"><span class="icon">&#x1F356;</span><span data-t="cat_meat">Meat</span></div>
        <div class="cat-chip" data-cat="Bakery"><span class="icon">&#x1F35E;</span><span data-t="cat_bakery">Bakery</span></div>
        <div class="cat-chip" data-cat="Frozen"><span class="icon">&#x2744;&#xFE0F;</span><span data-t="cat_frozen">Frozen</span></div>
        <div class="cat-chip" data-cat="Beverages"><span class="icon">&#x1F964;</span><span data-t="cat_beverages">Beverages</span></div>
        <div class="cat-chip" data-cat="Snacks"><span class="icon">&#x1F36F;</span><span data-t="cat_snacks">Snacks</span></div>
        <div class="cat-chip" data-cat="Cleaning"><span class="icon">&#x1F9F9;</span><span data-t="cat_cleaning">Cleaning</span></div>
        <div class="cat-chip" data-cat="Personal Care"><span class="icon">&#x1FAA5;</span><span data-t="cat_personal_care">Personal Care</span></div>
        <div class="cat-chip" data-cat="Baby"><span class="icon">&#x1F476;</span><span data-t="cat_baby">Baby</span></div>
        <div class="cat-chip" data-cat="Pharmacy"><span class="icon">&#x1F48A;</span><span data-t="cat_pharmacy">Pharmacy</span></div>
        <div class="cat-chip" data-cat="Other"><span class="icon">&#x1F4E6;</span><span data-t="cat_other">Other</span></div>
      </div>
      <div class="cat-custom">
        <label>Or enter a custom category</label>
        <input id="customCatInput" placeholder="e.g. Pet Food, Office Supplies..." />
      </div>
      <div class="modal-footer">
        <button class="btn btn-light" data-close="addItemModal">Cancel</button>
        <button class="btn btn-primary" id="nextToStep2Btn">Next &rarr;</button>
      </div>
    </div>

    <!-- Step 2: Item details -->
    <div id="itemStep2" style="display:none">
      <div class="steps">
        <div class="step done">&#10003;</div>
        <div class="step-line done"></div>
        <div class="step active">2</div>
      </div>
      <h3 data-t="item_details">Item Details</h3>
      <div style="margin-bottom:12px">
        Category: <span id="selectedCatBadge" class="item-cat" style="font-size:12px"></span>
        <span style="font-size:12px;color:#6C5CE7;cursor:pointer;margin-left:8px" id="changeCatBtn">(change)</span>
      </div>
      <label>Item Name <span style="color:#ef4444">*</span></label>
      <input id="newItemName" placeholder="e.g. Whole Milk" />
      <label>Quantity</label>
      <input id="newItemQty" type="number" value="1" min="1" />
      <label>Unit (optional)</label>
      <input id="newItemUnit" placeholder="e.g. kg, pcs, L" />
      <label>Estimated Price (optional)</label>
      <input id="newItemPrice" type="number" step="0.01" placeholder="0.00" />
      <label>Item Picture (optional)</label>
      <input id="newItemImage" type="file" accept="image/*" />
      <div style="margin-top:8px">
        <button class="btn btn-light" id="aiFindImageBtn" type="button" style="display:inline-flex;align-items:center;gap:6px">
          <span>&#x1F50D;</span> Find Image by AI
        </button>
        <span id="aiFindImageStatus" style="margin-left:8px;font-size:12px;color:#64748b"></span>
      </div>
      <div id="aiImagePreview" style="display:none;margin-top:10px;text-align:center">
        <img id="aiImagePreviewImg" style="max-height:120px;border-radius:8px;border:1px solid #e2e8f0;cursor:pointer" onclick="openLightbox(this.src, document.getElementById('aiImagePreviewTitle').textContent)" title="Click to enlarge" />
        <div style="margin-top:4px;font-size:11px;color:#64748b">
          <span id="aiImagePreviewTitle"></span> &middot; <span id="aiImagePreviewSource"></span>
        </div>
        <div style="margin-top:6px">
          <button class="btn btn-primary" id="aiImageUseBtn" type="button" style="font-size:12px;padding:5px 14px">Use this image</button>
          <button class="btn btn-light" id="aiImageDiscardBtn" type="button" style="font-size:12px;padding:5px 14px;margin-left:4px">Discard</button>
        </div>
      </div>
      <input type="hidden" id="aiImageUrl" value="" />
      <div class="modal-footer">
        <button class="btn btn-light" data-close="addItemModal">Cancel</button>
        <button class="btn btn-primary" id="saveItemBtn">Add Item</button>
      </div>
    </div>

  </div>
</div>

<div class="overlay" id="newExpenseModal">
  <div class="modal">
    <h3 data-t="add_expense_modal">Add Expense</h3>
    <label>Title</label>
    <input id="expTitle" placeholder="e.g. Supermarket run" />
    <label>Amount</label>
    <input id="expAmount" type="number" step="0.01" min="0.01" placeholder="0.00" />
    <label>Category</label>
    <select id="expCategory">
      <option value="groceries">Groceries</option>
      <option value="household">Household</option>
      <option value="personal">Personal</option>
      <option value="pharmacy">Pharmacy</option>
      <option value="other">Other</option>
    </select>
    <label>Date</label>
    <input id="expDate" type="date" />
    <div class="modal-footer">
      <button class="btn btn-light" data-close="newExpenseModal">Cancel</button>
      <button class="btn btn-primary" id="saveExpenseBtn">Save</button>
    </div>
  </div>
</div>

<div class="overlay" id="inviteMemberModal">
  <div class="modal">
    <h3 data-t="invite_member_modal">Invite Member</h3>
    <label>Full Name <span style="color:#ef4444">*</span></label>
    <input id="inviteFullName" placeholder="e.g. John Doe" />
    <label>Phone <span style="color:#ef4444">*</span></label>
    <input id="invitePhone" placeholder="e.g. +972501234567" />
    <label>Email <span style="color:#ef4444">*</span></label>
    <input id="inviteEmail" type="email" placeholder="e.g. member@example.com" />
    <label>Role</label>
    <select id="inviteRole">
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
    <div class="super-only" style="margin-top:8px">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:0">
        <input type="checkbox" id="inviteSysAdmin" style="width:auto" /> Promote to System Admin
      </label>
    </div>
    <div class="modal-footer">
      <button class="btn btn-light" data-close="inviteMemberModal">Cancel</button>
      <button class="btn btn-primary" id="sendInviteBtn">Send Invite</button>
    </div>
  </div>
</div>

<div class="overlay" id="editMemberModal">
  <div class="modal">
    <h3 data-t="edit_member">Edit Member</h3>
    <input type="hidden" id="editMemberId" />
    <label>Display Name</label>
    <input id="editMemberName" />
    <label>Phone</label>
    <input id="editMemberPhone" placeholder="e.g. +972501234567" />
    <label>Email</label>
    <input id="editMemberEmail" type="email" placeholder="e.g. member@example.com" />
    <label>Role</label>
    <select id="editMemberRole">
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
    <div class="super-only" style="margin-top:8px">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:0">
        <input type="checkbox" id="editMemberSysAdmin" style="width:auto" /> System Admin
      </label>
    </div>
    <hr style="margin:16px 0;border:none;border-top:1px solid #e2e8f0" />
    <label>New Password <span style="font-weight:400;color:#94a3b8">(leave empty to keep current)</span></label>
    <input id="editMemberPassword" type="password" placeholder="Min 8 characters" autocomplete="new-password" />
    <input type="hidden" id="editMemberUserId" />
    <div class="modal-footer">
      <button class="btn btn-light" data-close="editMemberModal">Cancel</button>
      <button class="btn btn-primary" id="saveMemberEditBtn">Save Changes</button>
    </div>
  </div>
</div>

<div class="overlay" id="qrLoginModal">
  <div class="modal" style="max-width:380px">
    <h3 data-t="qr_modal_title">📱 Login QR Code</h3>
    <div class="qr-modal-body">
      <div class="qr-member-name" id="qrMemberName"></div>
      <canvas id="qrCanvas" width="200" height="200"></canvas>
      <div class="qr-member-login" id="qrMemberLogin"></div>
      <div class="qr-hint" data-t="qr_modal_hint">Scan this QR code with a phone camera to open the login page with the member's email pre-filled.</div>
    </div>
    <div id="qrWhatsappRow" style="display:none;margin-top:12px">
      <a id="qrSendWhatsappLink" href="#" target="_blank" rel="noopener"
         class="btn btn-whatsapp" style="width:100%;font-size:14px;padding:11px 16px;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;box-sizing:border-box">
        <span data-t="qr_wa_send_btn">Send login link via WhatsApp</span>
      </a>
      <button class="btn btn-light" style="width:100%;margin-top:8px;font-size:13px;padding:9px 16px" id="qrCopyLinkBtn">
        📋 <span data-t="qr_copy_link">Copy login link</span>
      </button>
      <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:6px" id="qrWhatsappPhone"></p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-light" data-close="qrLoginModal" data-t="close">Close</button>
    </div>
  </div>
</div>

<div class="overlay" id="waGroupModal">
  <div class="modal" style="max-width:500px;max-height:90vh;overflow-y:auto">
    <h3 id="waGroupModalTitle">New WhatsApp Group</h3>
    <input type="hidden" id="waGroupEditId" />

    <label>Group Name <span style="color:#ef4444">*</span></label>
    <input id="waGroupNameInput" placeholder="e.g. Family Grocery Group" />

    <label style="margin-top:14px">Select Members <span style="color:#ef4444">*</span></label>
    <p style="font-size:12px;color:#64748b;margin-bottom:8px">Choose which family members are in this WhatsApp group. Only members with a phone number can be selected.</p>
    <div id="waGroupMemberPicker"><div class="loading">Loading members...</div></div>

    <div class="modal-footer">
      <button class="btn btn-light" data-close="waGroupModal">Cancel</button>
      <button class="btn btn-whatsapp" id="saveWaGroupBtn">&#128190; Save Group</button>
    </div>
  </div>
</div>

<div class="overlay" id="whatsappModal">
  <div class="modal" style="max-width:500px;max-height:90vh;overflow-y:auto">

    <!-- Step 1: Pick saved group -->
    <div id="waStep1">
      <div class="steps">
        <div class="step active">1</div><div class="step-line"></div>
        <div class="step pending">2</div>
      </div>
      <h3 data-t="send_list_wa">📱 Send List to WhatsApp</h3>
      <p style="font-size:13px;color:#64748b;margin:8px 0 12px" data-t="wa_select_group_desc">Select a saved WhatsApp group to send this list to.</p>
      <div id="waSavedGroupsList"></div>
      <div style="margin-top:12px;font-size:12px;color:#64748b">
        <span data-t="no_group_yet">Don't have a group yet?</span>
        <span style="color:#6C5CE7;cursor:pointer;font-weight:600" onclick="closeModal('whatsappModal');document.querySelector('[data-tab=whatsapp]').click()">
          <span data-t="go_wa_config">Go to WhatsApp Config &rarr;</span>
        </span>
      </div>
      <div class="modal-footer">
        <button class="btn btn-light" data-close="whatsappModal" data-t="cancel">Cancel</button>
        <button class="btn btn-whatsapp" id="waNext1" data-t="wa_preview_btn">Preview &amp; Send &rarr;</button>
      </div>
    </div>

    <!-- Step 2: Preview & send to group -->
    <div id="waStep2" style="display:none">
      <div class="steps">
        <div class="step done">&#10003;</div><div class="step-line done"></div>
        <div class="step active">2</div>
      </div>
      <h3 data-t="preview_send">Preview & Send</h3>
      <p style="font-size:13px;color:#64748b;margin:8px 0 4px" data-t="msg_preview">Message preview:</p>
      <div class="wa-preview" id="waPreview"></div>
      <div class="wa-send-row" id="waSendLinks"></div>
      <div style="margin-top:12px;font-size:12px;color:#94a3b8">&#9432; <span data-t="wa_group_note">WhatsApp will open — select your group and send the message.</span></div>
      <div class="modal-footer">
        <button class="btn btn-light" id="waBack1">&#8592; <span data-t="back">Back</span></button>
        <button class="btn btn-light" data-close="whatsappModal" data-t="close">Close</button>
      </div>
    </div>

  </div>
</div>

<!-- NEARBY STORES MODAL -->
<div class="overlay" id="nearbyStoresModal">
  <div class="modal" style="max-width:640px;max-height:90vh;overflow-y:auto">
    <h3 data-t="nearby_stores">Nearby Supermarkets</h3>
    <div id="nearbyStoresContent">
      <div class="loading" data-t="getting_location">Getting your location...</div>
    </div>
    <div style="margin-top:12px;font-size:11px;color:#94a3b8;text-align:center" data-t="prices_estimated">Prices are AI estimates and may vary</div>
    <div class="modal-footer">
      <button class="btn btn-light" data-close="nearbyStoresModal" data-t="close">Close</button>
    </div>
  </div>
</div>

<div id="lightbox" onclick="closeLightbox()">
  <button class="lb-close" onclick="closeLightbox()">&times;</button>
  <img id="lightboxImg" src="" alt="" />
  <div class="lb-title" id="lightboxTitle"></div>
</div>

<div id="toast"></div>

${__orHelper}
// ── Auth ─────────────────────────────────────────────────────────
const token = localStorage.getItem('familycart_token');
if (!token) { window.location.href = '/auth/login'; }

let currentUser = {};
let isSuperAdmin = false;
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  currentUser = payload;
  isSuperAdmin = !!payload.isSuperAdmin;
  // Show admin-only tabs/panels only for admin users (must run before t() which needs _translations)
  if (payload.role === 'admin' || isSuperAdmin) {
    document.body.classList.add('is-admin');
  }
  if (isSuperAdmin) {
    document.body.classList.add('is-super-admin');
  }
} catch {}


// ── i18n ──────────────────────────────────────────────────────────
const _translations = {
  // Nav
  welcome: { en: 'Welcome,', he: 'ברוך הבא,' },
  logout: { en: 'Logout', he: 'התנתק' },
  admin: { en: '★ Admin', he: '★ מנהל' },
  member_role: { en: 'Member', he: 'חבר' },
  // Tabs
  tab_lists: { en: '🛒 Shopping Lists', he: '🛒 רשימות קניות' },
  tab_expenses: { en: '💸 Expenses', he: '💸 הוצאות' },
  tab_members: { en: '👥 Members', he: '👥 חברים' },
  tab_whatsapp: { en: '📱 WhatsApp Config', he: '📱 הגדרות WhatsApp' },
  tab_profile: { en: '👤 Profile', he: '👤 פרופיל' },
  profile_title: { en: 'My Profile', he: 'הפרופיל שלי' },
  full_name_label: { en: 'Full name', he: 'שם מלא' },
  phone_label: { en: 'Phone number', he: 'מספר טלפון' },
  email_label: { en: 'Email', he: 'אימייל' },
  save_profile: { en: 'Save changes', he: 'שמור שינויים' },
  profile_saved: { en: 'Profile updated successfully', he: 'הפרופיל עודכן בהצלחה' },
  change_password_title: { en: 'Change Password', he: 'שינוי סיסמה' },
  current_password_label: { en: 'Current password', he: 'סיסמה נוכחית' },
  new_password_label: { en: 'New password', he: 'סיסמה חדשה' },
  confirm_password_label: { en: 'Confirm new password', he: 'אישור סיסמה חדשה' },
  change_password_btn: { en: 'Change Password', he: 'שנה סיסמה' },
  password_changed: { en: 'Password changed successfully', he: 'הסיסמה שונתה בהצלחה' },
  passwords_no_match: { en: 'Passwords do not match', he: 'הסיסמאות אינן תואמות' },
  password_too_short: { en: 'Password must be at least 8 characters', he: 'הסיסמה חייבת להכיל לפחות 8 תווים' },
  // Lists
  shopping_lists: { en: 'Shopping Lists', he: 'רשימות קניות' },
  new_list: { en: '+ New List', he: '+ רשימה חדשה' },
  loading: { en: 'Loading...', he: 'טוען...' },
  back_to_lists: { en: '← Back to lists', he: '→ חזרה לרשימות' },
  select_wa_group: { en: 'Select WhatsApp group...', he: 'בחר קבוצת WhatsApp...' },
  send_to_wa: { en: '📱 Send to WhatsApp', he: '📱 שלח ב-WhatsApp' },
  add_item: { en: '+ Add Item', he: '+ הוסף פריט' },
  no_lists: { en: 'No shopping lists yet. Create one!', he: 'אין רשימות קניות עדיין. צור אחת!' },
  failed_load_lists: { en: 'Failed to load lists.', he: 'טעינה נכשלה.' },
  items_word: { en: 'items', he: 'פריטים' },
  done_word: { en: 'done', he: 'הושלמו' },
  no_items: { en: 'No items yet. Add one!', he: 'אין פריטים עדיין. הוסף אחד!' },
  rename_list_prompt: { en: 'Enter new list name:', he: 'הזן שם רשימה חדש:' },
  list_renamed: { en: 'List renamed!', he: 'שם הרשימה שונה!' },
  delete_list_confirm: { en: 'Are you sure you want to permanently delete this list?', he: 'האם אתה בטוח שברצונך למחוק את הרשימה הזו לצמיתות?' },
  list_deleted: { en: 'List deleted', he: 'הרשימה נמחקה' },
  // Nearby stores
  find_stores: { en: '📍 Find Nearby Stores', he: '📍 מצא סופרים קרובים' },
  nearby_stores: { en: 'Nearby Supermarkets', he: 'סופרמרקטים קרובים' },
  searching_stores: { en: 'Searching nearby supermarkets...', he: 'מחפש סופרמרקטים קרובים...' },
  getting_location: { en: 'Getting your location...', he: 'מקבל את המיקום שלך...' },
  location_denied: { en: 'Location access denied. Please allow location in your browser settings and reload the page.', he: 'גישה למיקום נדחתה. אנא אפשר מיקום בהגדרות הדפדפן וטען מחדש את הדף.' },
  location_ip_fallback: { en: 'Using approximate location from IP...', he: 'משתמש במיקום משוער לפי כתובת IP...' },
  location_unavailable: { en: 'Could not determine your location. Please make sure location services are enabled on your device.', he: 'לא ניתן לקבוע את המיקום שלך. אנא ודא שהמיקום מופעל במכשיר שלך.' },
  location_timeout: { en: 'Location request timed out. Please try again.', he: 'בקשת המיקום פגה. אנא נסה שוב.' },
  no_stores_found: { en: 'No supermarkets found within 10km.', he: 'לא נמצאו סופרמרקטים בטווח 10 ק״מ.' },
  km_away: { en: 'km away', he: 'ק״מ' },
  coverage: { en: 'coverage', he: 'כיסוי' },
  estimated_total: { en: 'Estimated total', he: 'סה״כ משוער' },
  best_match: { en: '🏆 Best Match', he: '🏆 ההתאמה הטובה ביותר' },
  item_word: { en: 'Item', he: 'פריט' },
  est_price: { en: 'Est. Price', he: 'מחיר משוער' },
  not_available: { en: 'N/A', he: 'לא זמין' },
  navigate: { en: 'Navigate', he: 'נווט' },
  within_km: { en: 'within 10km', he: 'בטווח 10 ק״מ' },
  prices_estimated: { en: 'Prices are AI estimates and may vary', he: 'המחירים הם הערכות AI ועשויים להשתנות' },
  // Modals - Create List
  create_list: { en: 'Create Shopping List', he: 'צור רשימת קניות' },
  list_name: { en: 'List Name', he: 'שם הרשימה' },
  list_name_ph: { en: 'e.g. Weekly Groceries', he: 'לדוג׳ קניות שבועיות' },
  cancel: { en: 'Cancel', he: 'ביטול' },
  create: { en: 'Create', he: 'צור' },
  list_created: { en: 'List created!', he: 'הרשימה נוצרה!' },
  // Edit Item
  edit_item: { en: 'Edit Item', he: 'ערוך פריט' },
  item_name: { en: 'Item Name', he: 'שם הפריט' },
  item_name_ph: { en: 'e.g. Whole Milk', he: 'לדוג׳ חלב 3%' },
  quantity: { en: 'Quantity', he: 'כמות' },
  unit_opt: { en: 'Unit (optional)', he: 'יחידה (אופציונלי)' },
  unit_ph: { en: 'e.g. kg, pcs, L', he: 'לדוג׳ ק״ג, יח׳, ליטר' },
  price_opt: { en: 'Estimated Price (optional)', he: 'מחיר משוער (אופציונלי)' },
  category_opt: { en: 'Category (optional)', he: 'קטגוריה (אופציונלי)' },
  cat_ph: { en: 'e.g. Dairy, Produce', he: 'לדוג׳ מוצרי חלב, ירקות' },
  current_images: { en: 'Current Images', he: 'תמונות נוכחיות' },
  no_images: { en: 'No images yet', he: 'אין תמונות עדיין' },
  upload_pic: { en: 'Upload New Picture (optional)', he: 'העלה תמונה חדשה (אופציונלי)' },
  find_image_ai: { en: '🔍 Find Image by AI', he: '🔍 מצא תמונה ב-AI' },
  use_image: { en: 'Use this image', he: 'השתמש בתמונה' },
  discard: { en: 'Discard', he: 'בטל' },
  save_changes: { en: 'Save Changes', he: 'שמור שינויים' },
  item_updated: { en: 'Item updated!', he: 'הפריט עודכן!' },
  item_added: { en: 'Item added!', he: 'הפריט נוסף!' },
  item_removed: { en: 'Item removed', he: 'הפריט הוסר' },
  item_name_required: { en: 'Item name is required', he: 'שם הפריט נדרש' },
  primary_updated: { en: 'Primary image updated', he: 'תמונה ראשית עודכנה' },
  image_deleted: { en: 'Image deleted', he: 'התמונה נמחקה' },
  enter_name_first: { en: 'Enter an item name first', he: 'הזן שם פריט קודם' },
  searching: { en: 'Searching…', he: 'מחפש…' },
  no_image_found: { en: 'No image found', he: 'לא נמצאה תמונה' },
  ai_image_attached: { en: 'AI image will be attached when you save', he: 'תמונת AI תצורף בשמירה' },
  click_enlarge: { en: 'Click to enlarge', he: 'לחץ להגדלה' },
  // Add Item - Categories
  what_category: { en: 'What category is this item?', he: 'לאיזו קטגוריה שייך הפריט?' },
  cat_produce: { en: 'Produce', he: 'ירקות ופירות' },
  cat_dairy: { en: 'Dairy', he: 'מוצרי חלב' },
  cat_meat: { en: 'Meat', he: 'בשר' },
  cat_bakery: { en: 'Bakery', he: 'מאפים' },
  cat_frozen: { en: 'Frozen', he: 'קפוא' },
  cat_beverages: { en: 'Beverages', he: 'משקאות' },
  cat_snacks: { en: 'Snacks', he: 'חטיפים' },
  cat_cleaning: { en: 'Cleaning', he: 'ניקיון' },
  cat_personal: { en: 'Personal Care', he: 'טיפוח אישי' },
  cat_baby: { en: 'Baby', he: 'תינוקות' },
  cat_pharmacy: { en: 'Pharmacy', he: 'בית מרקחת' },
  cat_other: { en: 'Other', he: 'אחר' },
  custom_cat: { en: 'Or enter a custom category', he: 'או הזן קטגוריה מותאמת' },
  custom_cat_ph: { en: 'e.g. Pet Food, Office Supplies...', he: 'לדוג׳ מזון לחיות, ציוד משרדי...' },
  next: { en: 'Next →', he: '← הבא' },
  item_details: { en: 'Item Details', he: 'פרטי פריט' },
  category_label: { en: 'Category:', he: 'קטגוריה:' },
  change: { en: '(change)', he: '(שנה)' },
  pick_category: { en: 'Please pick or enter a category', he: 'אנא בחר או הזן קטגוריה' },
  item_pic_opt: { en: 'Item Picture (optional)', he: 'תמונת פריט (אופציונלי)' },
  // Expenses
  expenses: { en: 'Expenses', he: 'הוצאות' },
  add_expense: { en: '+ Add Expense', he: '+ הוסף הוצאה' },
  no_expenses: { en: 'No expenses yet.', he: 'אין הוצאות עדיין.' },
  failed_load_expenses: { en: 'Failed to load expenses.', he: 'טעינת הוצאות נכשלה.' },
  total: { en: 'Total:', he: 'סה״כ:' },
  entries: { en: 'entries', he: 'רשומות' },
  date: { en: 'Date', he: 'תאריך' },
  title: { en: 'Title', he: 'כותרת' },
  category: { en: 'Category', he: 'קטגוריה' },
  paid_by: { en: 'Paid by', he: 'שולם ע״י' },
  amount: { en: 'Amount', he: 'סכום' },
  add_expense_modal: { en: 'Add Expense', he: 'הוסף הוצאה' },
  title_ph: { en: 'e.g. Supermarket run', he: 'לדוג׳ קניות בסופר' },
  cat_groceries: { en: 'Groceries', he: 'מצרכים' },
  cat_household: { en: 'Household', he: 'משק בית' },
  cat_personal_exp: { en: 'Personal', he: 'אישי' },
  save: { en: 'Save', he: 'שמור' },
  expense_saved: { en: 'Expense saved!', he: 'ההוצאה נשמרה!' },
  fill_required: { en: 'Fill in all required fields', he: 'מלא את כל השדות הנדרשים' },
  // Members
  family_members: { en: 'Family Members', he: 'חברי משפחה' },
  members_desc: { en: 'Create, view, update role, and remove members.', he: 'צור, צפה, עדכן תפקיד והסר חברים.' },
  invite_member: { en: '+ Invite Member', he: '+ הזמן חבר' },
  no_members: { en: 'No members found.', he: 'לא נמצאו חברים.' },
  failed_load_members: { en: 'Failed to load members.', he: 'טעינת חברים נכשלה.' },
  name: { en: 'Name', he: 'שם' },
  phone: { en: 'Phone', he: 'טלפון' },
  email: { en: 'Email', he: 'דוא״ל' },
  role: { en: 'Role', he: 'תפקיד' },
  status: { en: 'Status', he: 'סטטוס' },
  joined: { en: 'Joined', he: 'הצטרף' },
  actions: { en: 'Actions', he: 'פעולות' },
  edit: { en: 'Edit', he: 'ערוך' },
  remove: { en: 'Remove', he: 'הסר' },
  invite_member_modal: { en: 'Invite Member', he: 'הזמן חבר' },
  full_name: { en: 'Full Name', he: 'שם מלא' },
  full_name_ph: { en: 'e.g. John Doe', he: 'לדוג׳ ישראל ישראלי' },
  phone_ph: { en: 'e.g. +972501234567', he: 'לדוג׳ 972501234567+' },
  email_ph: { en: 'e.g. member@example.com', he: 'לדוג׳ member@example.com' },
  send_invite: { en: 'Send Invite', he: 'שלח הזמנה' },
  invitation_sent: { en: 'Invitation sent successfully', he: 'ההזמנה נשלחה בהצלחה' },
  required_fields: { en: 'Full name, phone and email are required', he: 'שם מלא, טלפון ודוא״ל נדרשים' },
  valid_email: { en: 'Please enter a valid email', he: 'אנא הזן כתובת דוא״ל תקינה' },
  edit_member: { en: 'Edit Member', he: 'ערוך חבר' },
  display_name: { en: 'Display Name', he: 'שם תצוגה' },
  member_updated: { en: 'Member updated', he: 'החבר עודכן' },
  member_removed: { en: 'Member removed', he: 'החבר הוסר' },
  member_role_updated: { en: 'Member role updated', he: 'תפקיד החבר עודכן' },
  member_status_updated: { en: 'Member status updated', he: 'סטטוס החבר עודכן' },
  no_changes: { en: 'No changes to save', he: 'אין שינויים לשמירה' },
  cannot_change_own_role: { en: 'You cannot change your own role', he: 'לא ניתן לשנות את התפקיד שלך' },
  // WhatsApp Config
  wa_config: { en: '📱 WhatsApp Configuration', he: '📱 הגדרות WhatsApp' },
  wa_config_desc: { en: 'Manage your WhatsApp groups and settings for sending shopping lists.', he: 'נהל את קבוצות ה-WhatsApp שלך להפצת רשימות קניות.' },
  new_group: { en: '+ New Group', he: '+ קבוצה חדשה' },
  how_it_works: { en: 'How it works:', he: 'איך זה עובד:' },
  wa_step1_title: { en: '1. Create a group', he: '1. צור קבוצה' },
  wa_step1_desc: { en: 'Give it a name and pick which family members are in it.', he: 'תן לה שם ובחר אילו חברי משפחה בה.' },
  wa_step2_title: { en: '2. Open a shopping list', he: '2. פתח רשימת קניות' },
  wa_step2_desc: { en: 'Go to any list and click the green "Send to WhatsApp" button.', he: 'עבור לרשימה ולחץ על כפתור "שלח ב-WhatsApp" הירוק.' },
  wa_step3_title: { en: '3. Send the message', he: '3. שלח את ההודעה' },
  wa_step3_desc: { en: 'Pick your group, confirm recipients, preview and send via WhatsApp.', he: 'בחר קבוצה, אשר נמענים, צפה ושלח ב-WhatsApp.' },
  saved_groups: { en: 'Saved Groups', he: 'קבוצות שמורות' },
  no_wa_groups: { en: 'No WhatsApp groups saved yet.', he: 'אין קבוצות WhatsApp שמורות עדיין.' },
  click_new_group: { en: 'Click + New Group above to create your first group.', he: 'לחץ + קבוצה חדשה למעלה ליצירת הקבוצה הראשונה.' },
  group_deleted: { en: 'Group deleted', he: 'הקבוצה נמחקה' },
  group_saved: { en: 'Group saved!', he: 'הקבוצה נשמרה!' },
  group_updated: { en: 'Group updated!', he: 'הקבוצה עודכנה!' },
  new_wa_group: { en: 'New WhatsApp Group', he: 'קבוצת WhatsApp חדשה' },
  edit_wa_group: { en: 'Edit WhatsApp Group', he: 'ערוך קבוצת WhatsApp' },
  group_name: { en: 'Group Name', he: 'שם הקבוצה' },
  group_name_ph: { en: 'e.g. Family Grocery Group', he: 'לדוג׳ קבוצת קניות משפחתית' },
  select_members: { en: 'Select Members', he: 'בחר חברים' },
  select_members_desc: { en: 'Choose which family members are in this WhatsApp group. Only members with a phone number can be selected.', he: 'בחר אילו חברי משפחה בקבוצת WhatsApp זו. רק חברים עם מספר טלפון ניתנים לבחירה.' },
  loading_members: { en: 'Loading members...', he: 'טוען חברים...' },
  save_group: { en: '💾 Save Group', he: '💾 שמור קבוצה' },
  group_name_required: { en: 'Group name is required', he: 'שם הקבוצה נדרש' },
  select_one_member: { en: 'Select at least one member', he: 'בחר לפחות חבר אחד' },
  no_members_phone: { en: 'No family members with phone numbers found.', he: 'לא נמצאו חברי משפחה עם מספרי טלפון.' },
  // WA Send Flow
  send_list_wa: { en: 'Send List to WhatsApp', he: 'שלח רשימה ב-WhatsApp' },
  select_saved_group: { en: 'Select a saved WhatsApp group to send this list to.', he: 'בחר קבוצת WhatsApp שמורה לשליחת הרשימה.' },
  no_group_yet: { en: "Don't have a group yet?", he: 'אין לך קבוצה עדיין?' },
  go_wa_config: { en: 'Go to WhatsApp Config →', he: '← עבור להגדרות WhatsApp' },
  who_in_group: { en: 'Who is in this WhatsApp group?', he: 'מי בקבוצת WhatsApp הזו?' },
  select_recipients: { en: 'Select the family members that are part of the group. Their phone numbers will appear in the message.', he: 'בחר את חברי המשפחה בקבוצה. מספרי הטלפון שלהם יופיעו בהודעה.' },
  no_phone_note: { en: 'Members without a phone number cannot be selected.', he: 'חברים ללא מספר טלפון לא ניתנים לבחירה.' },
  preview_send: { en: 'Preview & Send', he: 'תצוגה מקדימה ושליחה' },
  msg_preview: { en: 'Message preview:', he: 'תצוגה מקדימה:' },
  send_each: { en: 'Send to each member:', he: 'שלח לכל חבר:' },
  open_wa: { en: '📱 Open WhatsApp', he: '📱 פתח WhatsApp' },
  open_wa_share: { en: '🔗 Open WhatsApp share (choose group manually)', he: '🔗 פתח שיתוף WhatsApp (בחר קבוצה ידנית)' },
  wa_paste_note: { en: 'WhatsApp will open for each recipient. Paste the message and send it to your group.', he: 'WhatsApp ייפתח לכל נמען. הדבק את ההודעה ושלח לקבוצה.' },
  back: { en: '← Back', he: '→ חזרה' },
  close: { en: 'Close', he: 'סגור' },
  send_to_wa_group: { en: 'Send to WhatsApp Group', he: 'שלח לקבוצת WhatsApp' },
  wa_group_note: { en: 'WhatsApp will open — select your group and send the message.', he: 'WhatsApp ייפתח — בחר את הקבוצה ושלח את ההודעה.' },
  wa_preview_btn: { en: 'Preview & Send →', he: 'תצוגה מקדימה ושליחה →' },
  wa_select_group_desc: { en: 'Select a saved WhatsApp group to send this list to.', he: 'בחר קבוצת WhatsApp שמורה לשליחת הרשימה.' },
  select_one_recipient: { en: 'Select at least one recipient', he: 'בחר לפחות נמען אחד' },
  select_wa_group_pls: { en: 'Please select a WhatsApp group', he: 'אנא בחר קבוצת WhatsApp' },
  sending_to_group: { en: 'Sending to group:', he: 'שולח לקבוצה:' },
  remaining: { en: 'remaining', he: 'נותרו' },
  view_with_photos: { en: 'View list with product photos', he: 'צפה ברשימה עם תמונות מוצרים' },
  // Confirms
  confirm_remove_item: { en: 'Remove this item?', he: 'להסיר פריט זה?' },
  confirm_delete_image: { en: 'Delete this image?', he: 'למחוק תמונה זו?' },
  confirm_delete_group: { en: 'Delete this WhatsApp group?', he: 'למחוק קבוצת WhatsApp זו?' },
  confirm_remove_member: { en: 'Remove this member from the family?', he: 'להסיר חבר זה מהמשפחה?' },
  // Misc
  not_image: { en: 'Selected file is not an image', he: 'הקובץ שנבחר אינו תמונה' },
  groups_saved: { en: 'groups saved', he: 'קבוצות שמורות' },
  group_word: { en: 'group', he: 'קבוצה' },
  member_word: { en: 'member', he: 'חבר' },
  members_word: { en: 'members', he: 'חברים' },
  primary_img: { en: 'Primary', he: 'ראשית' },
  no_groups_saved: { en: 'No groups saved yet. Go to the WhatsApp Config tab to create one.', he: 'אין קבוצות שמורות עדיין. עבור ללשונית הגדרות WhatsApp ליצירת אחת.' },
  uncategorised: { en: 'Uncategorised', he: 'ללא קטגוריה' },
  // Category names
  cat_produce: { en: 'Produce', he: 'ירקות ופירות' },
  cat_dairy: { en: 'Dairy', he: 'מוצרי חלב' },
  cat_meat: { en: 'Meat', he: 'בשר ועוף' },
  cat_bakery: { en: 'Bakery', he: 'מאפים' },
  cat_frozen: { en: 'Frozen', he: 'קפואים' },
  cat_beverages: { en: 'Beverages', he: 'משקאות' },
  cat_snacks: { en: 'Snacks', he: 'חטיפים' },
  cat_cleaning: { en: 'Cleaning', he: 'ניקיון' },
  cat_personal_care: { en: 'Personal Care', he: 'טיפוח' },
  cat_baby: { en: 'Baby', he: 'תינוקות' },
  cat_pharmacy: { en: 'Pharmacy', he: 'בית מרקחת' },
  cat_other: { en: 'Other', he: 'אחר' },
  across: { en: 'across', he: 'ב-' },
  edit_item_btn: { en: 'Edit item', he: 'ערוך פריט' },
  remove_item_btn: { en: 'Remove item', he: 'הסר פריט' },
  primary_dblclick: { en: 'Primary image — double-click to enlarge', he: 'תמונה ראשית — לחיצה כפולה להגדלה' },
  set_primary_dblclick: { en: 'Click to set as primary — double-click to enlarge', he: 'לחץ לקביעה כראשית — לחיצה כפולה להגדלה' },
  delete_btn: { en: 'Delete', he: 'מחק' },
  no_images_yet: { en: 'No images', he: 'אין תמונות' },
  email_missing: { en: 'Email input missing on page', he: 'שדה דוא״ל חסר בעמוד' },
  // QR login WhatsApp message
  qr_wa_hi: { en: 'Hi', he: 'היי' },
  qr_wa_login_link: { en: 'Here is your FamilyCart login link:', he: 'הנה קישור ההתחברות שלך ל-FamilyCart:' },
  qr_wa_instructions: { en: 'Open this link on your phone and enter your password to log in.', he: 'פתח את הקישור בטלפון והזן את הסיסמה שלך כדי להתחבר.' },
  qr_wa_send_btn: { en: 'Send login link via WhatsApp', he: 'שלח קישור התחברות ב-WhatsApp' },
  qr_wa_will_send_to: { en: 'Will send to', he: 'יישלח אל' },
  qr_copy_link: { en: 'Copy login link', he: 'העתק קישור התחברות' },
  qr_link_copied: { en: 'Login link copied!', he: 'קישור ההתחברות הועתק!' },
  qr_no_email_phone: { en: 'No email or phone for this member', he: 'אין דוא״ל או טלפון לחבר זה' },
  qr_modal_title: { en: 'Login QR Code', he: 'QR התחברות' },
  qr_modal_hint: { en: 'Scan this QR code with a phone camera to open the login page with the member\\'s email pre-filled.', he: 'סרוק את קוד ה-QR עם מצלמת הטלפון כדי לפתוח את דף ההתחברות עם הדוא״ל של החבר.' },
};

let _lang = localStorage.getItem('familycart_lang');
if (!_lang) {
  // Auto-detect: if browser language starts with 'he', default to Hebrew
  _lang = (navigator.language || '').startsWith('he') ? 'he' : 'en';
}

function t(key) {
  const entry = _translations[key];
  if (!entry) return key;
  return entry[_lang] || entry['en'] || key;
}

function setLang(lang) {
  _lang = lang;
  localStorage.setItem('familycart_lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.getElementById('langSelect').value = lang;
  translatePage();
}

function translatePage() {
  // Update all elements with data-t attribute
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    el.textContent = t(key);
  });
  // Update all elements with data-t-placeholder
  document.querySelectorAll('[data-t-ph]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-t-ph'));
  });
  // Update all elements with data-t-title
  document.querySelectorAll('[data-t-title]').forEach(el => {
    el.title = t(el.getAttribute('data-t-title'));
  });
  // Re-render nav badge and welcome
  document.getElementById('userBadge').textContent = isSuperAdmin ? '⚡ Super Admin' : currentUser.role === 'admin' ? t('admin') : t('member_role');
  if (currentUser.fullName) {
    document.getElementById('welcomeBanner').textContent = t('welcome') + ' ' + currentUser.fullName;
  }
  // Re-render dynamic content
  if (document.getElementById('tab-lists').classList.contains('active')) {
    if (currentListId) {
      // re-fetch and re-render items
      api('GET', '/lists/' + currentListId).then(d => renderItems(_or(d.items, []))).catch(() => {});
    } else {
      loadLists();
    }
  }
  if (document.getElementById('tab-expenses').classList.contains('active')) loadExpenses();
  if (document.getElementById('tab-members').classList.contains('active')) loadMembers();
  if (document.getElementById('tab-whatsapp').classList.contains('active')) renderWaGroups();
  if (document.getElementById('tab-profile').classList.contains('active')) loadProfile();
}

// Init language
document.documentElement.lang = _lang;
document.documentElement.dir = _lang === 'he' ? 'rtl' : 'ltr';
document.getElementById('langSelect').value = _lang;
document.getElementById('langSelect').onchange = function() { setLang(this.value); };

// Set user badge and welcome banner now that t() is available
document.getElementById('userBadge').textContent = isSuperAdmin ? '⚡ Super Admin' : currentUser.role === 'admin' ? t('admin') : t('member_role');

// Fetch full name from profile API (token may not contain it)
api('GET', '/auth/profile').then(function(data) {
  if (data && data.fullName) {
    currentUser.fullName = data.fullName;
    document.getElementById('welcomeBanner').textContent = t('welcome') + ' ' + data.fullName;
  }
}).catch(function() {});

document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem('familycart_token');
  window.location.href = isSuperAdmin ? '/auth/sys-login' : '/auth/login';
};

// ── API helper ────────────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {};
  const data = await res.json();
  if (!res.ok) throw new Error(_or(data.error, _or(data.message, 'Error')));
  return data;
}

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, err) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = err ? '#b91c1c' : 'linear-gradient(135deg,#6C5CE7,#E84393)';
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

// ── Tabs ──────────────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  var tabEl = document.querySelector('[data-tab="' + tabName + '"]');
  if (tabEl) tabEl.classList.add('active');
  var panelEl = document.getElementById('tab-' + tabName);
  if (panelEl) panelEl.classList.add('active');
  if (tabName === 'lists') loadLists();
  if (tabName === 'expenses') loadExpenses();
  if (tabName === 'members') loadMembers();
  if (tabName === 'whatsapp') renderWaGroups();
  if (tabName === 'profile') loadProfile();
  if (tabName === 'families') loadFamilies();
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => switchTab(tab.dataset.tab);
});

// ── Profile ───────────────────────────────────────────────────────
async function loadProfile() {
  try {
    const data = await api('GET', '/auth/profile');
    document.getElementById('profileFullName').value = _or(data.fullName, '');
    document.getElementById('profilePhone').value = _or(data.phone, '');
    document.getElementById('profileEmail').value = _or(data.email, '');
    const name = _or(data.fullName, '?');
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileRoleBadge').textContent = _or(currentUser.role, 'member');
  } catch (e) { toast(e.message, true); }
}

document.getElementById('saveProfileBtn').onclick = async () => {
  const fullName = document.getElementById('profileFullName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const email = document.getElementById('profileEmail').value.trim();
  if (!fullName && !phone && !email) { toast('Please fill in at least one field', true); return; }
  const body = {};
  if (fullName) body.fullName = fullName;
  if (phone) body.phone = phone;
  if (email) body.email = email;
  try {
    await api('PATCH', '/auth/profile', body);
    toast(t('profile_saved'));
  } catch (e) { toast(e.message, true); }
};

document.getElementById('changePasswordBtn').onclick = async () => {
  const currentPassword = document.getElementById('profileCurrentPw').value;
  const newPassword = document.getElementById('profileNewPw').value;
  const confirmPassword = document.getElementById('profileConfirmPw').value;
  if (!currentPassword || !newPassword) { toast(t('password_too_short'), true); return; }
  if (newPassword.length < 8) { toast(t('password_too_short'), true); return; }
  if (newPassword !== confirmPassword) { toast(t('passwords_no_match'), true); return; }
  try {
    await api('PUT', '/auth/change-password', { currentPassword, newPassword });
    document.getElementById('profileCurrentPw').value = '';
    document.getElementById('profileNewPw').value = '';
    document.getElementById('profileConfirmPw').value = '';
    toast(t('password_changed'));
  } catch (e) { toast(e.message, true); }
};

// ── Modal helpers ─────────────────────────────────────────────────
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.onclick = () => document.getElementById(btn.dataset.close).classList.remove('open');
});
document.querySelectorAll('.overlay').forEach(o => {
  o.onclick = e => { if (e.target === o) o.classList.remove('open'); };
});
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Lightbox (click image to view full size) ──────────────────────
function openLightbox(url, title) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightboxTitle').textContent = title ? title : '';
  lb.classList.add('open');
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  document.getElementById('lightboxImg').src = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('lightbox').classList.contains('open')) {
    closeLightbox();
  }
});
// ─────────────────────────────────────────────────────────────────
// LISTS
// ─────────────────────────────────────────────────────────────────
let currentListId = null;

// Super-admin family filter state
let selectedFamilyId = '';

function onFamilyFilterChange() {
  selectedFamilyId = document.getElementById('familySelect').value;
  loadLists();
  loadExpenses();
}

async function loadFamilies() {
  if (!isSuperAdmin) return;
  try {
    const families = await api('GET', '/admin/families');
    // Populate family selector
    const sel = document.getElementById('familySelect');
    sel.innerHTML = '<option value="">All families</option>' +
      families.map(f => '<option value="' + f.id + '">' + f.name + ' (' + f.slug + ')</option>').join('');
    // Populate families panel
    const grid = document.getElementById('familiesGrid');
    if (!families.length) { grid.innerHTML = '<div class="empty">No families</div>'; return; }
    grid.innerHTML = families.map(f => \`
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <h3 style="flex:1">\${f.name}</h3>
          <button class="item-del" title="Rename" onclick="event.stopPropagation();renameFamily('\${f.id}', '\${f.name.replace(/'/g,'&apos;')}')" style="color:#6C5CE7;font-size:14px;padding:2px 4px">&#9998;</button>
        </div>
        <div class="meta" style="margin-bottom:4px">Slug: <b>\${f.slug}</b></div>
        <div class="meta">\${f.memberCount} members &nbsp;·&nbsp; \${f.listCount} lists</div>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-light" style="font-size:12px;padding:6px 12px" onclick="selectedFamilyId='\${f.id}';document.getElementById('familySelect').value='\${f.id}';switchTab('lists');loadLists();">View lists</button>
          <button class="btn btn-light" style="font-size:12px;padding:6px 12px" onclick="selectedFamilyId='\${f.id}';document.getElementById('familySelect').value='\${f.id}';switchTab('members');loadMembers();">View members</button>
        </div>
      </div>
    \`).join('');
  } catch (e) { console.error('loadFamilies', e); }
}

document.getElementById('createFamilyBtn').onclick = async () => {
  const name = document.getElementById('newFamilyName').value.trim();
  if (!name) return;
  try {
    await api('POST', '/admin/families', { name });
    closeModal('newFamilyModal');
    document.getElementById('newFamilyName').value = '';
    toast('Family created');
    loadFamilies();
  } catch (e) { toast(e.message, true); }
};

async function renameFamily(familyId, currentName) {
  const newName = prompt('Enter new family name:', currentName);
  if (!newName || newName.trim() === currentName) return;
  try {
    await api('PATCH', '/admin/families/' + familyId, { name: newName.trim() });
    toast('Family renamed');
    loadFamilies();
  } catch (e) { toast(e.message, true); }
}

async function loadLists() {
  const el = document.getElementById('listsGrid');
  el.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const qs = 'status=all' + (isSuperAdmin && selectedFamilyId ? '&familyId=' + selectedFamilyId : '');
    const resp = await api('GET', '/lists?' + qs);
    const lists = _or(resp.data, []);
    if (!lists.length) { el.innerHTML = '<div class="empty">' + t('no_lists') + '</div>'; return; }
    el.innerHTML = lists.map(l => \`
      <div class="card" data-id="\${l.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <h3 style="flex:1;cursor:pointer" onclick="openList('\${l.id}', '\${l.name.replace(/'/g,'&apos;')}')">\${l.name}</h3>
          <button class="item-del" title="\${t('edit')}" onclick="event.stopPropagation();renameList('\${l.id}', '\${l.name.replace(/'/g,'&apos;')}')" style="color:#6C5CE7;font-size:14px;padding:2px 4px">&#9998;</button>
          \${(currentUser.role === 'admin' || isSuperAdmin) ? \`<button class="item-del" title="Delete list" onclick="event.stopPropagation();deleteList('\${l.id}', '\${l.name.replace(/'/g,'&apos;')}')" style="color:#b91c1c;font-size:14px;padding:2px 4px">&#128465;</button>\` : ''}
        </div>
        \${isSuperAdmin && l.familyName ? \`<div class="meta" style="margin-bottom:4px;color:#6C5CE7;font-weight:600">🏠 \${l.familyName}</div>\` : ''}
        <div class="meta" style="margin-bottom:8px;cursor:pointer" onclick="openList('\${l.id}', '\${l.name.replace(/'/g,'&apos;')}')">
          \${l.itemCount} \${t('items_word')} &nbsp;·&nbsp; \${l.purchasedCount} \${t('done_word')}
        </div>
        <span class="badge badge-\${l.status}" style="cursor:pointer" onclick="openList('\${l.id}', '\${l.name.replace(/'/g,'&apos;')}')">\${l.status}</span>
      </div>
    \`).join('');
  } catch (e) { el.innerHTML = '<div class="empty">' + t('failed_load_lists') + '</div>'; toast(e.message, true); }
}

document.getElementById('newListBtn').onclick = () => openModal('newListModal');
document.getElementById('createListBtn').onclick = async () => {
  const name = document.getElementById('newListName').value.trim();
  if (!name) return;
  try {
    await api('POST', '/lists', { name });
    closeModal('newListModal');
    document.getElementById('newListName').value = '';
    toast(t('list_created'));
    loadLists();
  } catch (e) { toast(e.message, true); }
};

async function renameList(listId, currentName) {
  const newName = prompt(t('rename_list_prompt'), currentName);
  if (!newName || newName.trim() === currentName) return;
  try {
    await api('PATCH', '/lists/' + listId, { name: newName.trim() });
    toast(t('list_renamed'));
    loadLists();
  } catch (e) { toast(e.message, true); }
}

async function deleteList(listId, listName) {
  if (!confirm(t('delete_list_confirm') + '\\n\\n' + listName)) return;
  try {
    await api('DELETE', '/lists/' + listId);
    toast(t('list_deleted'));
    loadLists();
  } catch (e) { toast(e.message, true); }
}

async function openList(id, name) {
  currentListId = id;
  document.getElementById('listsView').style.display = 'none';
  document.getElementById('listDetailView').style.display = 'block';
  document.getElementById('listDetailTitle').textContent = name;
  populateListWaGroupSelect();
  document.getElementById('itemsContainer').innerHTML = '<div class="loading">Loading...</div>';
  try {
    const detail = await api('GET', '/lists/' + id);
    renderItems(_or(detail.items, []));
  } catch (e) { toast(e.message, true); }
}

function renderItems(items) {
  const c = document.getElementById('itemsContainer');
  if (!items.length) { c.innerHTML = '<div class="empty">' + t('no_items') + '</div>'; return; }
  const catIcons = {Produce:'&#x1F96C;',Dairy:'&#x1F9C0;',Meat:'&#x1F356;',Bakery:'&#x1F35E;',Frozen:'&#x2744;&#xFE0F;',Beverages:'&#x1F964;',Snacks:'&#x1F36F;',Cleaning:'&#x1F9F9;','Personal Care':'&#x1FAA5;',Baby:'&#x1F476;',Pharmacy:'&#x1F48A;',Other:'&#x1F4E6;'};
  const catTransKey = {Produce:'cat_produce',Dairy:'cat_dairy',Meat:'cat_meat',Bakery:'cat_bakery',Frozen:'cat_frozen',Beverages:'cat_beverages',Snacks:'cat_snacks',Cleaning:'cat_cleaning','Personal Care':'cat_personal_care',Baby:'cat_baby',Pharmacy:'cat_pharmacy',Other:'cat_other'};
  const catOrder = ['Produce','Dairy','Meat','Bakery','Frozen','Beverages','Snacks','Cleaning','Personal Care','Baby','Pharmacy','Other'];
  // Group by category
  const groups = {};
  items.forEach(i => {
    const cat = _or(i.category, t('uncategorised'));
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(i);
  });
  const sortedCats = Object.keys(groups).sort((a, b) => {
    const oa = catOrder.indexOf(a); const ob = catOrder.indexOf(b);
    return (oa === -1 ? 999 : oa) - (ob === -1 ? 999 : ob);
  });
  c.innerHTML = sortedCats.map(cat => {
    const catItems = groups[cat];
    const icon = _or(catIcons[cat], '&#x1F4CB;');
    const catLabel = catTransKey[cat] ? t(catTransKey[cat]) : cat;
    return \`
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;padding:4px 0 6px;border-bottom:1px solid #f1f5f9;margin-bottom:4px">\${icon} \${catLabel}</div>
      \${catItems.map(i => {
        const primary = _or((_or(i.images, [])).find(img => img.isPrimary), (_or(i.images, []))[0]);
        const safeData = JSON.stringify({id:i.id,name:i.name,quantity:i.quantity,unit:_or(i.unit, ""),estimatedPrice:_or(i.estimatedPrice, ""),category:_or(i.category, ""),images:_or(i.images, [])}).replace(/'/g,"&#39;");
        return \`
        <div class="item-row" id="item-\${i.id}" data-item='\${safeData}'>
          <input class="item-check" type="checkbox" \${i.isPurchased ? 'checked' : ''}
            onchange="toggleItem('\${i.id}', this.checked)" />
          \${primary ? '<img src="' + primary.url + '" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;flex-shrink:0;cursor:pointer" onclick="event.stopPropagation();openLightbox(\\'' + primary.url + '\\', \\'' + i.name.replace(/'/g,'') + '\\')" title="Click to enlarge" />' : '<div style="width:36px;height:36px;border-radius:6px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;border:1px solid #e2e8f0">&#x1F4F7;</div>'}
          <span class="item-name \${i.isPurchased ? 'done' : ''}" style="flex:1">\${i.name}</span>
          <span class="item-qty">\${i.quantity}\${i.unit ? ' ' + i.unit : ''}</span>
          \${i.estimatedPrice ? '<span class="item-qty">$' + parseFloat(i.estimatedPrice).toFixed(2) + '</span>' : ''}
          <button class="item-del" title="Edit item" onclick="openEditItem('\${i.id}')" style="color:#6C5CE7">&#9998;</button>
          <button class="item-del" title="Remove item" onclick="deleteItem('\${i.id}', this)">&#x1F5D1;</button>
        </div>\`;
      }).join('')}
    </div>
  \`}).join('');
}

async function toggleItem(itemId, checked) {
  try {
    await api('PATCH', '/lists/items/' + itemId, { isPurchased: checked });
    const row = document.getElementById('item-' + itemId);
    row.querySelector('.item-name').classList.toggle('done', checked);
  } catch (e) { toast(e.message, true); }
}

async function deleteItem(itemId, btn) {
  if (!confirm(t('confirm_remove_item'))) return;
  try {
    btn.disabled = true;
    await api('DELETE', '/lists/items/' + itemId);
    const row = document.getElementById('item-' + itemId);
    row.style.transition = 'opacity .2s';
    row.style.opacity = '0';
    setTimeout(() => {
      row.remove();
      // If group is empty, reload to clean up headers
      const detail = document.getElementById('itemsContainer');
      if (!detail.querySelector('.item-row')) {
        detail.innerHTML = '<div class="empty">' + t('no_items') + '</div>';
      }
    }, 200);
    toast(t('item_removed'));
  } catch (e) { btn.disabled = false; toast(e.message, true); }
}

// ── Edit Item ─────────────────────────────────────────────────────
function openEditItem(itemId) {
  const row = document.getElementById('item-' + itemId);
  if (!row) return;
  const data = JSON.parse(row.getAttribute('data-item'));
  document.getElementById('editItemId').value = data.id;
  document.getElementById('editItemName').value = data.name;
  document.getElementById('editItemQty').value = data.quantity;
  document.getElementById('editItemUnit').value = _or(data.unit, '');
  document.getElementById('editItemPrice').value = _or(data.estimatedPrice, '');
  document.getElementById('editItemCategory').value = _or(data.category, '');
  // Highlight matching category chip
  document.querySelectorAll('.edit-cat-chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.cat === _or(data.category, ''));
  });
  document.getElementById('editItemImage').value = '';
  document.getElementById('editAiImageUrl').value = '';
  document.getElementById('editAiImagePreview').style.display = 'none';
  document.getElementById('editAiFindImageStatus').textContent = '';

  // Render existing images
  const imagesEl = document.getElementById('editItemImages');
  const imgs = Array.isArray(data.images) ? data.images : [];
  if (!imgs.length) {
    imagesEl.innerHTML = '<span style="color:#94a3b8;font-size:13px">' + t('no_images') + '</span>';
  } else {
    imagesEl.innerHTML = imgs.map(img => \`
      <div style="position:relative;display:inline-block">
        <img src="\${img.url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid \${img.isPrimary ? '#6C5CE7' : '#e2e8f0'};cursor:pointer"
             title="\${img.isPrimary ? 'Primary image — double-click to enlarge' : 'Click to set as primary — double-click to enlarge'}"
             onclick="setEditImgPrimary('\${data.id}', '\${img.id}')"
             ondblclick="event.stopPropagation();openLightbox('\${img.url}', '\${data.name.replace(/'/g,'')}')" />
        \${img.isPrimary ? '<span style="position:absolute;top:2px;left:2px;background:#6C5CE7;color:#fff;font-size:9px;padding:1px 5px;border-radius:4px">Primary</span>' : ''}
        <button onclick="deleteEditImg('\${data.id}', '\${img.id}')" style="position:absolute;top:2px;right:2px;background:#fff;border:1px solid #fecaca;color:#b91c1c;border-radius:50%;width:20px;height:20px;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;line-height:1">&times;</button>
      </div>
    \`).join('');
  }

  openModal('editItemModal');
}

async function setEditImgPrimary(itemId, imageId) {
  try {
    await api('PATCH', '/media/' + imageId + '/primary', {});
    toast(t('primary_updated'));
    // Refresh the item data and re-open the modal
    const detail = await api('GET', '/lists/' + currentListId);
    renderItems(_or(detail.items, []));
    openEditItem(itemId);
  } catch (e) { toast(e.message, true); }
}

async function deleteEditImg(itemId, imageId) {
  if (!confirm(t('confirm_delete_image'))) return;
  try {
    await api('DELETE', '/media/' + imageId);
    toast(t('image_deleted'));
    const detail = await api('GET', '/lists/' + currentListId);
    renderItems(_or(detail.items, []));
    openEditItem(itemId);
  } catch (e) { toast(e.message, true); }
}

document.getElementById('editAiFindImageBtn').onclick = async () => {
  const name = document.getElementById('editItemName').value.trim();
  if (!name) { toast(t('enter_name_first'), true); return; }
  const btn = document.getElementById('editAiFindImageBtn');
  const statusEl = document.getElementById('editAiFindImageStatus');
  btn.disabled = true;
  statusEl.textContent = t('searching');
  try {
    const cat = _or(document.getElementById('editItemCategory').value.trim(), undefined);
    const result = await api('POST', '/lists/items/ai-image-search', { name, category: cat });
    document.getElementById('editAiImagePreviewImg').src = result.imageUrl;
    document.getElementById('editAiImagePreviewTitle').textContent = _or(result.title, '');
    document.getElementById('editAiImagePreviewSource').textContent = _or(result.source, '');
    document.getElementById('editAiImagePreview').style.display = 'block';
    document.getElementById('editAiImageUrl').value = result.imageUrl;
    statusEl.textContent = '';
  } catch (e) {
    statusEl.textContent = _or(e.message, t('no_image_found'));
    document.getElementById('editAiImagePreview').style.display = 'none';
    document.getElementById('editAiImageUrl').value = '';
  }
  btn.disabled = false;
};

document.getElementById('editAiImageUseBtn').onclick = () => {
  toast(t('ai_image_attached'));
};

document.getElementById('editAiImageDiscardBtn').onclick = () => {
  document.getElementById('editAiImageUrl').value = '';
  document.getElementById('editAiImagePreview').style.display = 'none';
};

document.getElementById('updateItemBtn').onclick = async () => {
  const itemId = document.getElementById('editItemId').value;
  const name = document.getElementById('editItemName').value.trim();
  const quantity = _or(parseFloat(document.getElementById('editItemQty').value), 1);
  const unit = _or(document.getElementById('editItemUnit').value.trim(), undefined);
  const estimatedPrice = _or(parseFloat(document.getElementById('editItemPrice').value), undefined);
  const category = _or(document.getElementById('editItemCategory').value.trim(), undefined);
  const imageFile = document.getElementById('editItemImage').files?.[0];
  const aiImageUrl = document.getElementById('editAiImageUrl').value.trim();
  if (!name) { toast(t('item_name_required'), true); return; }
  try {
    await api('PATCH', '/lists/items/' + itemId, { name, quantity, unit, estimatedPrice, category });

    if (imageFile) {
      if (!imageFile.type.startsWith('image/')) throw new Error(t('not_image'));
      const dataUrl = await fileToDataUrl(imageFile);
      await api('POST', '/lists/items/' + itemId + '/images', { url: dataUrl, isPrimary: true });
    } else if (aiImageUrl) {
      await api('POST', '/lists/items/' + itemId + '/images', { url: aiImageUrl, isPrimary: true });
    }

    closeModal('editItemModal');
    toast(t('item_updated'));
    const detail = await api('GET', '/lists/' + currentListId);
    renderItems(_or(detail.items, []));
  } catch (e) { toast(e.message, true); }
};

document.getElementById('backToLists').onclick = () => {
  currentListId = null;
  document.getElementById('listsView').style.display = 'block';
  document.getElementById('listDetailView').style.display = 'none';
};

// ── Nearby Stores Search ────────────────────────────────────────
document.getElementById('findStoresBtn').onclick = () => {
  if (!currentListId) return;
  const content = document.getElementById('nearbyStoresContent');
  content.innerHTML = '<div class="loading">' + t('getting_location') + '</div>';
  openModal('nearbyStoresModal');

  if (!navigator.geolocation) {
    content.innerHTML = '<div class="empty">' + t('location_unavailable') + '</div>';
    return;
  }

  function onLocationSuccess(pos) {
    content.innerHTML = '<div class="loading">' + t('searching_stores') + '</div>';
    api('POST', '/lists/' + currentListId + '/nearby-stores', {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      radiusKm: 10,
    }).then(function(result) {
      renderNearbyStores(result);
    }).catch(function(e) {
      content.innerHTML = '<div class="empty">' + (e.message) + '</div>';
    });
  }

  function ipFallback() {
    content.innerHTML = '<div class="loading">' + t('location_ip_fallback') + '</div>';
    fetch('/geolocate').then(function(r) { return r.json(); }).then(function(data) {
      if (data.lat && data.lng) {
        onLocationSuccess({ coords: { latitude: data.lat, longitude: data.lng } });
      } else {
        content.innerHTML = '<div class="empty">' + t('location_unavailable') + '</div>';
      }
    }).catch(function() {
      content.innerHTML = '<div class="empty">' + t('location_unavailable') + '</div>';
    });
  }

  function onLocationError(err) {
    if (err.code === 3) {
      // TIMEOUT
      content.innerHTML = '<div class="empty">' + t('location_timeout') + '</div>';
    } else {
      // PERMISSION_DENIED or POSITION_UNAVAILABLE — try IP fallback
      ipFallback();
    }
  }

  if (!navigator.geolocation || !window.isSecureContext) {
    // Geolocation unavailable (non-HTTPS or unsupported) — use IP fallback
    ipFallback();
  } else {
    // Try high accuracy first; if it fails with POSITION_UNAVAILABLE or TIMEOUT,
    // retry with low accuracy (IP/WiFi-based) which works on most desktops.
    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      function(err) {
        if (err.code === 1) {
          // Permission denied — fall back to IP geolocation
          ipFallback();
        } else {
          // Retry without high accuracy
          navigator.geolocation.getCurrentPosition(
            onLocationSuccess,
            onLocationError,
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
};

function renderNearbyStores(result) {
  const el = document.getElementById('nearbyStoresContent');
  if (!result.stores || !result.stores.length) {
    el.innerHTML = '<div class="empty">' + t('no_stores_found') + '</div>';
    return;
  }

  el.innerHTML = result.stores.map((store, idx) => {
    const badge = idx === 0 ? '<span style="background:#fef9c3;color:#854d0e;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">' + t('best_match') + '</span>' : '';
    const medalColors = ['#f59e0b', '#94a3b8', '#cd7f32'];
    const medal = ['🥇', '🥈', '🥉'][idx] || '';

    const itemRows = store.itemPrices.map(ip => {
      const priceText = ip.estimatedPrice !== null
        ? '<strong>' + ip.currency + ip.estimatedPrice.toFixed(2) + '</strong>'
        : '<span style="color:#94a3b8">' + t('not_available') + '</span>';
      return '<tr><td style="font-size:13px">' + ip.name + '</td><td style="text-align:right;font-size:13px">' + priceText + '</td></tr>';
    }).join('');

    const navUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + store.lat + ',' + store.lng;

    return '<div style="border:1px solid ' + (idx === 0 ? '#f59e0b' : '#e2e8f0') + ';border-radius:10px;padding:16px;margin-bottom:12px;' + (idx === 0 ? 'background:#fffbeb' : 'background:#f8fafc') + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">' +
        '<div>' +
          '<h4 style="font-size:15px;margin-bottom:4px">' + medal + ' ' + store.name + ' ' + badge + '</h4>' +
          '<div style="font-size:12px;color:#64748b">' +
            '📍 ' + store.distance + ' ' + t('km_away') +
            (store.address ? ' · ' + store.address : '') +
          '</div>' +
        '</div>' +
        '<a href="' + navUrl + '" target="_blank" rel="noopener" class="btn btn-light" style="font-size:11px;padding:5px 10px;text-decoration:none;white-space:nowrap">' +
          '🧭 ' + t('navigate') +
        '</a>' +
      '</div>' +
      '<div style="display:flex;gap:16px;margin-bottom:10px">' +
        '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 12px;flex:1;text-align:center">' +
          '<div style="font-size:11px;color:#64748b">' + t('coverage') + '</div>' +
          '<div style="font-size:18px;font-weight:700;color:#15803d">' + store.coveragePercent + '%</div>' +
          '<div style="font-size:11px;color:#64748b">' + store.coverageCount + '/' + result.totalItems + '</div>' +
        '</div>' +
        '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 12px;flex:1;text-align:center">' +
          '<div style="font-size:11px;color:#64748b">' + t('estimated_total') + '</div>' +
          '<div style="font-size:18px;font-weight:700;color:#1e40af">₪' + store.totalEstimated.toFixed(2) + '</div>' +
        '</div>' +
      '</div>' +
      '<table style="width:100%;font-size:13px;border-collapse:collapse">' +
        '<thead><tr><th style="text-align:left;padding:4px 0;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b">' + t('item_word') + '</th><th style="text-align:right;padding:4px 0;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b">' + t('est_price') + '</th></tr></thead>' +
        '<tbody>' + itemRows + '</tbody>' +
      '</table>' +
    '</div>';
  }).join('');
}

// ─────────────────────────────────────────────────────────────────
// WHATSAPP CONFIG — saved groups in localStorage
// ─────────────────────────────────────────────────────────────────
function getWaGroups() {
  try { return JSON.parse(_or(localStorage.getItem('familycart_wa_groups'), '[]')); } catch { return []; }
}
function saveWaGroups(groups) {
  localStorage.setItem('familycart_wa_groups', JSON.stringify(groups));
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function populateListWaGroupSelect() {
  const select = document.getElementById('listWaGroupSelect');
  if (!select) return;
  const groups = getWaGroups();
  const prev = select.value;
  select.innerHTML = '<option value="" data-t="select_wa_group">Select WhatsApp group...</option>';
  groups.forEach(g => {
    select.innerHTML += '<option value="' + g.id + '">' + g.name + ' (' + g.members.length + ')</option>';
  });
  if (prev && groups.some(g => g.id === prev)) select.value = prev;
  select.disabled = groups.length === 0;
}

function renderWaGroups() {
  const el = document.getElementById('waGroupsList');
  const countEl = document.getElementById('waGroupCount');
  const groups = getWaGroups();
  if (countEl) countEl.textContent = groups.length ? groups.length + ' group' + (groups.length > 1 ? 's' : '') + ' saved' : '';
  if (!groups.length) {
    el.innerHTML = '<div class="wa-group-empty">&#128242;<br><br>No WhatsApp groups saved yet.<br>Click <strong>+ New Group</strong> above to create your first group.</div>';
    populateListWaGroupSelect();
    return;
  }
  el.innerHTML = groups.map(g => \`
    <div class="wa-group-card">
      <h4>&#128242; \${g.name} <span class="badge badge-active">\${g.members.length} member\${g.members.length !== 1 ? 's' : ''}</span></h4>
      <div class="wa-group-members">
        \${g.members.map(m => \`<span class="wa-member-pill">&#128100; \${m.name} &nbsp;·&nbsp; \${m.phone}</span>\`).join('')}
      </div>
      <div class="wa-group-actions">
        <button class="btn btn-light" style="font-size:12px" onclick="editWaGroup('\${g.id}')">&#9998; Edit</button>
        <button class="btn btn-danger" style="font-size:12px" onclick="deleteWaGroup('\${g.id}')">&#x1F5D1; Delete</button>
      </div>
    </div>
  \`).join('');
  populateListWaGroupSelect();
}

let waGroupAllMembers = [];

async function openWaGroupModal(editId) {
  document.getElementById('waGroupEditId').value = _or(editId, '');
  document.getElementById('waGroupModalTitle').textContent = editId ? t('edit_wa_group') : t('new_wa_group');
  document.getElementById('waGroupNameInput').value = '';
  const picker = document.getElementById('waGroupMemberPicker');
  picker.innerHTML = '<div class="loading">Loading members...</div>';
  openModal('waGroupModal');

  try { waGroupAllMembers = await api('GET', '/members'); } catch { waGroupAllMembers = []; }

  const withPhone = waGroupAllMembers.filter(m => m.phone);
  let preSelected = [];
  if (editId) {
    const existing = getWaGroups().find(g => g.id === editId);
    if (existing) {
      document.getElementById('waGroupNameInput').value = existing.name;
      preSelected = existing.members.map(m => m.phone);
    }
  }

  if (!withPhone.length) {
    picker.innerHTML = '<div class="empty" style="padding:12px">No family members with phone numbers found.</div>';
    return;
  }
  picker.innerHTML = withPhone.map(m => \`
    <label class="member-check-row">
      <input type="checkbox" class="wa-group-member-cb" data-phone="\${m.phone}" data-name="\${m.fullName}"
        \${preSelected.includes(m.phone) ? 'checked' : ''} />
      <div>
        <div style="font-size:14px;font-weight:600">\${m.fullName}</div>
        <div style="font-size:12px;color:#64748b">\${m.phone} &nbsp;·&nbsp;
          <span class="badge \${m.role==='admin'?'badge-active':'badge-completed'}">\${m.role}</span>
        </div>
      </div>
    </label>
  \`).join('');
}

document.getElementById('newWaGroupBtn').onclick = () => openWaGroupModal(null);

function editWaGroup(id) { openWaGroupModal(id); }

function deleteWaGroup(id) {
  if (!confirm(t('confirm_delete_group'))) return;
  saveWaGroups(getWaGroups().filter(g => g.id !== id));
  renderWaGroups();
  toast(t('group_deleted'));
}

document.getElementById('saveWaGroupBtn').onclick = () => {
  const name = document.getElementById('waGroupNameInput').value.trim();
  if (!name) { toast(t('group_name_required'), true); return; }
  const checked = [...document.querySelectorAll('.wa-group-member-cb:checked')];
  if (!checked.length) { toast(t('select_one_member'), true); return; }
  const members = checked.map(cb => ({ name: cb.dataset.name, phone: cb.dataset.phone }));
  const editId = document.getElementById('waGroupEditId').value;
  const groups = getWaGroups();
  if (editId) {
    const idx = groups.findIndex(g => g.id === editId);
    if (idx >= 0) groups[idx] = { id: editId, name, members };
  } else {
    groups.push({ id: genId(), name, members });
  }
  saveWaGroups(groups);
  closeModal('waGroupModal');
  renderWaGroups();
  toast(editId ? t('group_updated') : t('group_saved'));
};

// ─────────────────────────────────────────────────────────────────
// WHATSAPP SEND FLOW (uses saved groups)
// ─────────────────────────────────────────────────────────────────
let waSelectedGroup = null;

function waReset() {
  document.getElementById('waStep1').style.display = 'block';
  document.getElementById('waStep2').style.display = 'none';
  waSelectedGroup = null;
}

document.getElementById('sendWhatsappBtn').onclick = () => {
  const selectedGroupId = document.getElementById('listWaGroupSelect')?.value;
  if (selectedGroupId) {
    const selected = getWaGroups().find(g => g.id === selectedGroupId);
    if (selected) {
      waReset();
      waSelectedGroup = selected;
      openModal('whatsappModal');
      buildWaPreview();
      return;
    }
  }

  waReset();
  const el = document.getElementById('waSavedGroupsList');
  const groups = getWaGroups();
  if (!groups.length) {
    el.innerHTML = '<div class="wa-group-empty">' + t('no_wa_groups') + '</div>';
  } else {
    el.innerHTML = groups.map(g => \`
      <div class="wa-group-card" id="wag-\${g.id}" style="cursor:pointer;border:2px solid #e2e8f0"
        onclick="selectWaGroup('\${g.id}')">
        <h4>&#128242; \${g.name} <span class="badge badge-active">\${g.members.length} \${t('members_word')}</span></h4>
        <div class="wa-group-members">
          \${g.members.map(m => \`<span class="wa-member-pill">\${m.name}</span>\`).join('')}
        </div>
      </div>
    \`).join('');
  }
  openModal('whatsappModal');
};

function selectWaGroup(groupId) {
  const groups = getWaGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  waSelectedGroup = group;
  document.querySelectorAll('#waSavedGroupsList .wa-group-card').forEach(c => {
    c.style.borderColor = c.id === 'wag-' + groupId ? '#6C5CE7' : '#e2e8f0';
    c.style.background = c.id === 'wag-' + groupId ? '#f0fdfa' : '';
  });
}

// Step 1 → 2: build message preview and show "Send to Group" button
document.getElementById('waNext1').onclick = () => {
  if (!waSelectedGroup) { toast(t('select_wa_group_pls'), true); return; }
  buildWaPreview();
};

// Step 2 → 1
document.getElementById('waBack1').onclick = () => {
  document.getElementById('waStep2').style.display = 'none';
  document.getElementById('waStep1').style.display = 'block';
};

async function buildWaPreview() {
  if (!waSelectedGroup) { toast(t('select_wa_group_pls'), true); return; }

  const catTransKey = {Produce:'cat_produce',Dairy:'cat_dairy',Meat:'cat_meat',Bakery:'cat_bakery',Frozen:'cat_frozen',Beverages:'cat_beverages',Snacks:'cat_snacks',Cleaning:'cat_cleaning','Personal Care':'cat_personal_care',Baby:'cat_baby',Pharmacy:'cat_pharmacy',Other:'cat_other'};

  const listTitle = document.getElementById('listDetailTitle').textContent;
  let detail;
  try { detail = await api('GET', '/lists/' + currentListId); } catch (e) { toast(e.message, true); return; }

  // Fetch shareable link (contains product images)
  let shareUrl = '';
  try {
    const shareData = await api('GET', '/lists/' + currentListId + '/share-link');
    // Server returns absolute URL when APP_URL is set or host is public;
    // otherwise returns a relative path that we prepend with origin.
    const url = shareData.shareUrl;
    shareUrl = url.startsWith('http') ? url : (window.location.origin + url);
  } catch (e) {
    console.warn('[share-link]', e);
    // Continue without the photos link — text message still works
  }

  const items = _or(detail.items, []);
  const grouped = {};
  items.forEach(i => {
    const cat = _or(i.category, 'Other');
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(i);
  });

  const hasImages = items.some(i => { const imgs = _or(i.images, []); return imgs.length > 0; });

  const date = new Date().toLocaleDateString();
  let msg = '\\uD83D\\uDED2 *' + listTitle + '*\\n';
  msg += '\\uD83D\\uDCC5 ' + date + '\\n';
  msg += '\\u2500'.repeat(20) + '\\n';

  let total = 0, totalDone = 0;
  Object.entries(grouped).forEach(([cat, catItems]) => {
    const catLabel = catTransKey[cat] ? t(catTransKey[cat]) : cat;
    msg += '\\n*' + catLabel.toUpperCase() + '*\\n';
    catItems.forEach(i => {
      const check = i.isPurchased ? '\\u2705' : '\\u2610';
      const qty = i.quantity + (i.unit ? ' ' + i.unit : '');
      const price = i.estimatedPrice ? ' - \\u20AA' + parseFloat(i.estimatedPrice).toFixed(2) : '';
      msg += check + ' ' + i.name + ' x' + qty + price + '\\n';
      total++; if (i.isPurchased) totalDone++;
    });
  });

  msg += '\\n' + '\\u2500'.repeat(20) + '\\n';
  msg += '\\uD83D\\uDCCA ' + total + ' ' + t('items_word') + ' | \\u2705 ' + totalDone + ' ' + t('done_word') + ' | \\u23F3 ' + (total - totalDone) + ' ' + t('remaining') + '\\n';

  // Add share link with product images instead of raw image URLs
  if (shareUrl && hasImages) {
    msg += '\\n\\uD83D\\uDDBC\\uFE0F ' + t('view_with_photos') + ':\\n' + shareUrl + '\\n';
  }

  msg += '_Sent via FamilyCart_';

  document.getElementById('waPreview').textContent = msg;
  const encoded = encodeURIComponent(msg);
  const links = document.getElementById('waSendLinks');
  links.innerHTML = \`
    <div style="text-align:center;margin-top:12px">
      <a href="https://wa.me/?text=\${encoded}" target="_blank" rel="noopener"
         class="btn btn-whatsapp" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-size:15px;padding:12px 24px">
        &#128242; \${t('send_to_wa_group')}
      </a>
    </div>
  \`;

  document.getElementById('waStep1').style.display = 'none';
  document.getElementById('waStep2').style.display = 'block';
}

document.getElementById('addItemBtn').onclick = () => {
  // Reset to step 1
  document.getElementById('itemStep1').style.display = 'block';
  document.getElementById('itemStep2').style.display = 'none';
  document.querySelectorAll('.cat-chip:not(.edit-cat-chip)').forEach(c => c.classList.remove('selected'));
  document.getElementById('customCatInput').value = '';
  document.getElementById('newItemName').value = '';
  document.getElementById('newItemQty').value = '1';
  document.getElementById('newItemUnit').value = '';
  document.getElementById('newItemPrice').value = '';
  document.getElementById('newItemImage').value = '';
  // Reset AI image state
  document.getElementById('aiImageUrl').value = '';
  document.getElementById('aiImagePreview').style.display = 'none';
  document.getElementById('aiFindImageStatus').textContent = '';
  openModal('addItemModal');
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Category chip selection
let selectedCategory = '';
document.querySelectorAll('.cat-chip:not(.edit-cat-chip)').forEach(chip => {
  chip.onclick = () => {
    document.querySelectorAll('.cat-chip:not(.edit-cat-chip)').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedCategory = chip.dataset.cat;
    document.getElementById('customCatInput').value = '';
  };
});

// Edit-item category chip selection
document.querySelectorAll('.edit-cat-chip').forEach(chip => {
  chip.onclick = () => {
    const wasSelected = chip.classList.contains('selected');
    document.querySelectorAll('.edit-cat-chip').forEach(c => c.classList.remove('selected'));
    if (!wasSelected) {
      chip.classList.add('selected');
      document.getElementById('editItemCategory').value = chip.dataset.cat;
    } else {
      document.getElementById('editItemCategory').value = '';
    }
  };
});
document.getElementById('customCatInput').addEventListener('input', () => {
  const val = document.getElementById('customCatInput').value.trim();
  if (val) {
    document.querySelectorAll('.cat-chip:not(.edit-cat-chip)').forEach(c => c.classList.remove('selected'));
    selectedCategory = val;
  }
});

document.getElementById('nextToStep2Btn').onclick = () => {
  const custom = document.getElementById('customCatInput').value.trim();
  if (custom) selectedCategory = custom;
  if (!selectedCategory) { toast(t('pick_category'), true); return; }
  document.getElementById('selectedCatBadge').textContent = selectedCategory;
  document.getElementById('itemStep1').style.display = 'none';
  document.getElementById('itemStep2').style.display = 'block';
};

document.getElementById('changeCatBtn').onclick = () => {
  document.getElementById('itemStep2').style.display = 'none';
  document.getElementById('itemStep1').style.display = 'block';
};

// ── AI Image Search ──────────────────────────────────────────────
document.getElementById('aiFindImageBtn').onclick = async () => {
  const name = document.getElementById('newItemName').value.trim();
  if (!name) { toast(t('enter_name_first'), true); return; }
  const statusEl = document.getElementById('aiFindImageStatus');
  const btn = document.getElementById('aiFindImageBtn');
  btn.disabled = true;
  statusEl.textContent = t('searching');
  try {
    const result = await api('POST', '/lists/items/ai-image-search', { name, category: _or(selectedCategory, undefined) });
    document.getElementById('aiImagePreviewImg').src = result.imageUrl;
    document.getElementById('aiImagePreviewTitle').textContent = _or(result.title, '');
    document.getElementById('aiImagePreviewSource').textContent = _or(result.source, '');
    document.getElementById('aiImagePreview').style.display = 'block';
    document.getElementById('aiImageUrl').value = result.imageUrl;
    statusEl.textContent = '';
  } catch (e) {
    statusEl.textContent = _or(e.message, t('no_image_found'));
    document.getElementById('aiImagePreview').style.display = 'none';
    document.getElementById('aiImageUrl').value = '';
  }
  btn.disabled = false;
};

document.getElementById('aiImageUseBtn').onclick = () => {
  // imageUrl is already stored in the hidden input; nothing else to do
  toast(t('ai_image_attached'));
};

document.getElementById('aiImageDiscardBtn').onclick = () => {
  document.getElementById('aiImageUrl').value = '';
  document.getElementById('aiImagePreview').style.display = 'none';
};

document.getElementById('saveItemBtn').onclick = async () => {
  const name = document.getElementById('newItemName').value.trim();
  const quantity = _or(parseFloat(document.getElementById('newItemQty').value), 1);
  const unit = _or(document.getElementById('newItemUnit').value.trim(), undefined);
  const estimatedPrice = _or(parseFloat(document.getElementById('newItemPrice').value), undefined);
  const imageFile = document.getElementById('newItemImage').files?.[0];
  const aiImageUrl = document.getElementById('aiImageUrl').value.trim();
  const category = _or(selectedCategory, undefined);
  if (!name) { toast(t('item_name_required'), true); return; }
  try {
    const item = await api('POST', '/lists/' + currentListId + '/items', { name, quantity, unit, estimatedPrice, category });

    // Attach user-uploaded file image
    if (imageFile) {
      if (!imageFile.type.startsWith('image/')) {
        throw new Error(t('not_image'));
      }
      const dataUrl = await fileToDataUrl(imageFile);
      await api('POST', '/lists/items/' + item.id + '/images', { url: dataUrl, isPrimary: true });
    }

    // Attach AI-found image (if no file was uploaded)
    if (aiImageUrl && !imageFile) {
      await api('POST', '/lists/items/' + item.id + '/images', { url: aiImageUrl, isPrimary: true });
    }

    closeModal('addItemModal');
    selectedCategory = '';
    toast(t('item_added'));
    const detail = await api('GET', '/lists/' + currentListId);
    renderItems(_or(detail.items, []));
  } catch (e) { toast(e.message, true); }
};

// ─────────────────────────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────────────────────────
async function loadExpenses() {
  const el = document.getElementById('expensesTable');
  el.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const expQs = isSuperAdmin && selectedFamilyId ? '?familyId=' + selectedFamilyId : '';
    const exps = await api('GET', '/expenses' + expQs);
    if (!exps.length) { el.innerHTML = '<div class="empty">' + t('no_expenses') + '</div>'; return; }
    const total = exps.reduce((s, e) => s + parseFloat(e.totalAmount), 0);
    el.innerHTML = \`
      <div style="margin-bottom:12px;font-size:14px;color:#475569">
        Total: <strong style="color:#6C5CE7">$\${total.toFixed(2)}</strong> across \${exps.length} entries
      </div>
      <table>
        <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Paid by</th><th>Amount</th></tr></thead>
        <tbody>
          \${exps.map(e => \`
            <tr>
              <td>\${e.date}</td>
              <td>\${e.title}</td>
              <td><span class="badge badge-\${e.category}">\${e.category}</span></td>
              <td>\${_or(e.paidByName, '-')}</td>
              <td class="amount">$\${parseFloat(e.totalAmount).toFixed(2)}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;
  } catch (e) { el.innerHTML = '<div class="empty">' + t('failed_load_expenses') + '</div>'; toast(e.message, true); }
}

document.getElementById('newExpenseBtn').onclick = () => {
  document.getElementById('expDate').value = new Date().toISOString().slice(0,10);
  openModal('newExpenseModal');
};
document.getElementById('saveExpenseBtn').onclick = async () => {
  const title = document.getElementById('expTitle').value.trim();
  const totalAmount = parseFloat(document.getElementById('expAmount').value);
  const category = document.getElementById('expCategory').value;
  const date = document.getElementById('expDate').value;
  if (_or(_or(!title, !totalAmount), !date)) { toast(t('fill_required'), true); return; }
  try {
    await api('POST', '/expenses', { title, totalAmount, category, date: new Date(date).toISOString() });
    closeModal('newExpenseModal');
    document.getElementById('expTitle').value = '';
    document.getElementById('expAmount').value = '';
    toast(t('expense_saved'));
    loadExpenses();
  } catch (e) { toast(e.message, true); }
};

// ─────────────────────────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────────────────────────
async function loadMembers() {
  const el = document.getElementById('membersTable');
  el.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    const membersQs = isSuperAdmin && selectedFamilyId ? '?familyId=' + selectedFamilyId : '';
    const members = await api('GET', '/members' + membersQs);
    const isAdmin = currentUser.role === 'admin' || isSuperAdmin;
    if (!members.length) { el.innerHTML = '<div class="empty">' + t('no_members') + '</div>'; return; }

    // For sys_admin, look up is_super_admin status per user
    let superAdminMap = {};
    if (isSuperAdmin) {
      try {
        const families = await api('GET', '/admin/families');
        // We already have family names from members response
      } catch {}
    }

    el.innerHTML = \`
      <table>
        <thead><tr>\${isSuperAdmin ? '<th>Family</th>' : ''}<th>Name</th><th>Phone</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>
          \${members.map(m => \`
            <tr>
              \${isSuperAdmin ? \`<td style="font-size:12px;color:#6C5CE7;font-weight:600">\${_or(m.familyName, '-')}</td>\` : ''}
              <td><strong>\${m.fullName}</strong></td>
              <td>\${_or(m.phone, '-')}</td>
              <td>\${_or(m.email, '-')}</td>
              <td>
                <span class="badge \${m.role === 'admin' ? 'badge-active' : 'badge-completed'}">\${m.role}</span>
                \${m.isSuperAdmin ? '<span class="badge" style="background:#EDE9FE;color:#7C3AED;margin-left:4px">sys_admin</span>' : ''}
              </td>
              <td>
                \${isAdmin ? \`
                  <select
                    style="padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;min-width:120px"
                    onchange="updateMemberStatus('\${m.id}', this.value)">
                    <option value="register" \${m.status === 'register' ? 'selected' : ''}>register</option>
                    <option value="active" \${m.status === 'active' ? 'selected' : ''}>active</option>
                    <option value="suspended" \${m.status === 'suspended' ? 'selected' : ''}>suspended</option>
                    <option value="deleted" \${m.status === 'deleted' ? 'selected' : ''}>deleted</option>
                  </select>
                \` : m.status}
              </td>
              <td>\${new Date(m.joinedAt).toLocaleDateString()}</td>
              <td>
                \${isAdmin ? \`
                  <button
                    class="btn-qr"
                    onclick="showMemberQR('\${m.id}')">
                    📱 QR
                  </button>
                  <button
                    class="btn btn-light"
                    style="font-size:12px;padding:6px 10px;margin-right:6px"
                    onclick="openEditMember('\${m.id}', '\${m.role}', '\${encodeURIComponent(_or(m.fullName, ''))}', '\${encodeURIComponent(_or(m.phone, ''))}', '\${encodeURIComponent(_or(m.email, ''))}', \${m.userId === currentUser.id ? 'true' : 'false'}, '\${m.userId}', \${!!m.isSuperAdmin})">
                    Edit
                  </button>
                  \${m.mustChangePassword ? \`
                  <button
                    class="btn"
                    style="font-size:12px;padding:6px 10px;margin-right:6px;background:#25D366;color:#fff;border:none;border-radius:6px;cursor:pointer"
                    onclick="resendInvite('\${m.userId}', '\${encodeURIComponent(_or(m.phone, ''))}', '\${encodeURIComponent(_or(m.fullName, ''))}')">
                    Resend Invite
                  </button>
                  \` : ''}
                  <button
                    class="btn btn-danger"
                    style="font-size:12px;padding:6px 10px"
                    onclick="removeMember('\${m.id}')">
                    Remove
                  </button>
                \` : '<span style="color:#94a3b8">-</span>'}
              </td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;
  } catch (e) { el.innerHTML = '<div class="empty">' + t('failed_load_members') + '</div>'; toast(e.message, true); }
}

document.getElementById('inviteMemberBtn').onclick = () => {
  document.getElementById('inviteFullName').value = '';
  document.getElementById('invitePhone').value = '';
  document.getElementById('inviteEmail').value = '';
  document.getElementById('inviteRole').value = 'member';
  var saCb = document.getElementById('inviteSysAdmin');
  if (saCb) saCb.checked = false;
  openModal('inviteMemberModal');
};

document.getElementById('sendInviteBtn').onclick = async () => {
  const fullName = document.getElementById('inviteFullName').value.trim();
  const phone = document.getElementById('invitePhone').value.trim();
  const emailInput = document.getElementById('inviteEmail');
  if (!emailInput) {
    toast(t('email_missing'), true);
    return;
  }
  const email = emailInput.value.trim();
  const role = document.getElementById('inviteRole').value;
  if (_or(_or(!fullName, !phone), !email)) {
    toast(t('required_fields'), true);
    return;
  }
  emailInput.value = email;
  if (!emailInput.checkValidity()) {
    toast(t('valid_email'), true);
    return;
  }
  try {
    const inviteRes = await api('POST', '/auth/invite', { fullName, phone, email, role });
    // If sys_admin checkbox is checked, promote the invited user
    var saCb = document.getElementById('inviteSysAdmin');
    if (isSuperAdmin && saCb && saCb.checked) {
      // Find the user by email to get their userId
      const allMembers = await api('GET', '/members');
      const invited = allMembers.find(m => m.email && m.email.toLowerCase() === email.toLowerCase());
      if (invited) {
        await api('PATCH', '/admin/users/' + invited.userId + '/super-admin', { isSuperAdmin: true });
      }
    }
    closeModal('inviteMemberModal');
    toast(t('invitation_sent'));
    loadMembers();
  } catch (e) {
    toast(e.message, true);
  }
};

async function resendInvite(userId, encodedPhone, encodedName) {
  const phone = decodeURIComponent(encodedPhone);
  const fullName = decodeURIComponent(encodedName);
  if (!confirm('Resend invitation to ' + fullName + ' via WhatsApp?')) return;
  try {
    const res = await api('POST', '/auth/invite/resend', { userId });
    const msg = encodeURIComponent('Hi ' + fullName + '! You\\'re invited to FamilyCart. Set your password here: ' + res.inviteUrl);
    window.open('https://wa.me/' + phone.replace(/[^0-9]/g, '') + '?text=' + msg, '_blank');
    toast(t('invitation_sent'));
  } catch (e) {
    toast(e.message, true);
  }
}

async function updateMemberRole(memberId, role) {
  try {
    await api('PATCH', '/members/' + memberId + '/role', { role });
    toast(t('member_role_updated'));
    loadMembers();
  } catch (e) {
    toast(e.message, true);
    loadMembers();
  }
}

async function updateMemberStatus(memberId, status) {
  try {
    await api('PATCH', '/members/' + memberId + '/status', { status });
    toast(t('member_status_updated'));
    loadMembers();
  } catch (e) {
    toast(e.message, true);
    loadMembers();
  }
}

function openEditMember(memberId, currentRole, fullName, phone, email, isSelf, userId, memberIsSuperAdmin) {
  const selfEdit = _or(isSelf === true, isSelf === 'true');

  let decodedName = _or(fullName, '');
  let decodedPhone = _or(phone, '');
  let decodedEmail = _or(email, '');
  try { decodedName = decodeURIComponent(decodedName); } catch {}
  try { decodedPhone = decodeURIComponent(decodedPhone); } catch {}
  try { decodedEmail = decodeURIComponent(decodedEmail); } catch {}

  document.getElementById('editMemberId').value = memberId;
  document.getElementById('editMemberUserId').value = _or(userId, '');
  document.getElementById('editMemberName').value = decodedName;
  document.getElementById('editMemberPhone').value = _or(decodedPhone, '');
  document.getElementById('editMemberEmail').value = _or(decodedEmail, '');
  document.getElementById('editMemberPassword').value = '';
  document.getElementById('editMemberRole').value = currentRole;
  document.getElementById('editMemberRole').disabled = false;
  var saCb = document.getElementById('editMemberSysAdmin');
  if (saCb) {
    saCb.checked = !!memberIsSuperAdmin;
    saCb.disabled = selfEdit; // cannot toggle own sys_admin
  }
  const saveBtn = document.getElementById('saveMemberEditBtn');
  saveBtn.dataset.originalRole = _or(currentRole, '');
  saveBtn.dataset.originalSysAdmin = memberIsSuperAdmin ? 'true' : 'false';
  saveBtn.dataset.originalName = (_or(decodedName, '')).trim();
  saveBtn.dataset.originalPhone = (_or(decodedPhone, '')).trim();
  saveBtn.dataset.originalEmail = (_or(decodedEmail, '')).trim().toLowerCase();
  saveBtn.dataset.isSelf = selfEdit ? 'true' : 'false';
  openModal('editMemberModal');
}

document.getElementById('saveMemberEditBtn').onclick = async () => {
  const saveBtn = document.getElementById('saveMemberEditBtn');
  const memberId = document.getElementById('editMemberId').value;
  const fullName = document.getElementById('editMemberName').value.trim();
  const phone = document.getElementById('editMemberPhone').value.trim();
  const emailInput = document.getElementById('editMemberEmail');
  if (!emailInput) {
    toast(t('email_missing'), true);
    return;
  }
  const email = emailInput.value.trim().toLowerCase();
  const role = document.getElementById('editMemberRole').value;
  const isSelf = saveBtn.dataset.isSelf === 'true';
  const originalRole = _or(saveBtn.dataset.originalRole, '');
  const originalName = (_or(saveBtn.dataset.originalName, '')).trim();
  const originalPhone = (_or(saveBtn.dataset.originalPhone, '')).trim();
  const originalEmail = (_or(saveBtn.dataset.originalEmail, '')).trim().toLowerCase();
  if (!memberId) return;

  if (email && !emailInput.checkValidity()) {
    toast(t('valid_email'), true);
    return;
  }

  const newPassword = document.getElementById('editMemberPassword').value;
  const userId = document.getElementById('editMemberUserId').value;
  const profileChanged = _or(_or(fullName !== originalName, phone !== originalPhone), email !== originalEmail);
  const roleChanged = role !== originalRole;
  const passwordChanged = newPassword.length > 0;

  // sys_admin checkbox
  var saCb = document.getElementById('editMemberSysAdmin');
  const originalSysAdmin = saveBtn.dataset.originalSysAdmin === 'true';
  const newSysAdmin = saCb ? saCb.checked : originalSysAdmin;
  const sysAdminChanged = isSuperAdmin && !isSelf && (newSysAdmin !== originalSysAdmin);

  if (isSelf && roleChanged) {
    toast(t('cannot_change_own_role'), true);
  }

  if (passwordChanged && newPassword.length < 8) {
    toast('Password must be at least 8 characters', true);
    return;
  }

  if (!profileChanged && !roleChanged && !passwordChanged && !sysAdminChanged) {
    toast(t('no_changes'));
    closeModal('editMemberModal');
    return;
  }

  try {
    if (profileChanged) {
      await api('PATCH', '/members/' + memberId + '/profile', { fullName, phone, email });
    }
    if (roleChanged && !isSelf) {
      await api('PATCH', '/members/' + memberId + '/role', { role });
    }
    if (sysAdminChanged && userId) {
      await api('PATCH', '/admin/users/' + userId + '/super-admin', { isSuperAdmin: newSysAdmin });
    }
    if (passwordChanged && userId) {
      await api('PUT', '/auth/admin-set-password', { userId: userId, password: newPassword });
    }
    closeModal('editMemberModal');
    toast(passwordChanged ? t('member_updated') + ' (password changed)' : t('member_updated'));
    loadMembers();
  } catch (e) {
    toast(e.message, true);
  }
};

async function removeMember(memberId) {
  if (!confirm(t('confirm_remove_member'))) return;
  try {
    await api('DELETE', '/members/' + memberId);
    toast(t('member_removed'));
    loadMembers();
  } catch (e) {
    toast(e.message, true);
  }
}

// ─────────────────────────────────────────────────────────────────
// QR CODE — uses lightweight qrcode-generator from CDN
// ─────────────────────────────────────────────────────────────────

let _qrLibLoaded = false;
function ensureQRLib() {
  return new Promise((resolve, reject) => {
    if (_qrLibLoaded && typeof qrcode !== 'undefined') return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
    s.onload = () => { _qrLibLoaded = true; resolve(); };
    s.onerror = () => reject(new Error('Failed to load QR library'));
    document.head.appendChild(s);
  });
}

function drawQR(canvas, text, size) {
  size = size || 240;
  const qr = qrcode(0, 'L');
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cellSize = size / moduleCount;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw modules
  ctx.fillStyle = '#0f172a';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          Math.floor(c * cellSize),
          Math.floor(r * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }
  }
}

async function showMemberQR(memberId) {
  try {
    await ensureQRLib();
    const data = await api('GET', '/members/' + memberId + '/qr');
    const loginId = _or(data.loginId, _or(data.email, data.phone));
    if (!loginId) { toast(t('qr_no_email_phone'), true); return; }

    document.getElementById('qrMemberName').textContent = _or(data.fullName, 'Member');
    document.getElementById('qrMemberLogin').textContent = loginId;

    // Use the loginUrl from the server — it contains the LAN IP
    // and uses /auth/m/<base64url> format (no @ or ? in URL).
    var loginUrl = data.loginUrl;
    var canvas = document.getElementById('qrCanvas');
    drawQR(canvas, loginUrl, 240);

    // WhatsApp send button — show only if member has a phone number
    var waRow = document.getElementById('qrWhatsappRow');
    var waLink = document.getElementById('qrSendWhatsappLink');
    var waCopyBtn = document.getElementById('qrCopyLinkBtn');
    var waPhone = document.getElementById('qrWhatsappPhone');
    if (data.phone) {
      waRow.style.display = 'block';
      waPhone.textContent = t('qr_wa_will_send_to') + ' ' + data.phone;

      // Build message — URL must be on its own line with NO wrapping
      // characters (no LRE/PDF Unicode, no brackets, no quotes) so
      // WhatsApp auto-links it correctly. The URL must start with
      // http:// or https:// for WhatsApp to recognize it as a link.
      var cleanPhone = data.phone.replace(/[^0-9]/g, '');
      var name = _or(data.fullName, '');
      var msg = t('qr_wa_hi') + ' ' + name + '!' + '\\n\\n'
              + t('qr_wa_login_link') + '\\n\\n'
              + loginUrl + '\\n\\n'
              + t('qr_wa_instructions');
      waLink.onclick = function(e) {
        e.preventDefault();
        window.open('https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg), '_blank');
      };

      // Copy link fallback
      waCopyBtn.onclick = function() {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(loginUrl).then(function() { toast(t('qr_link_copied')); });
        } else {
          // Fallback for older browsers
          var ta = document.createElement('textarea');
          ta.value = loginUrl;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          toast(t('qr_link_copied'));
        }
      };
    } else {
      waRow.style.display = 'none';
    }

    openModal('qrLoginModal');
    translatePage();
  } catch (e) {
    toast('Failed to load QR: ' + e.message, true);
  }
}

// ── Initial load ──────────────────────────────────────────────────
translatePage();
loadFamilies();
loadLists();
</script>
</body>
</html>`

    return reply.type('text/html; charset=utf-8').send(html)
  })

}

