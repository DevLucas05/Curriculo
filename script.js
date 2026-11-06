// Interações do site. É tudo acabamento: sem este arquivo a página continua completa.
const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('ano').textContent = new Date().getFullYear();

/* Nome em pixel "decodificando" letra por letra ao abrir. */
if (!calmo) {
    const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&';
    document.querySelectorAll('.pixel span').forEach((el, i) => {
        const certa = el.textContent;
        const fim = performance.now() + 500 + i * 140;
        (function passo(t) {
            if (t >= fim) { el.textContent = certa; return; }
            el.textContent = LETRAS[Math.random() * LETRAS.length | 0];
            setTimeout(() => passo(performance.now()), 55);
        })(performance.now());
    });
}

/* Adesivos, fotos e selos dá para arrastar com o mouse. No toque fica a rolagem normal. */
let camada = 10;
document.querySelectorAll('[data-arrastar]').forEach(el => {
    let inicioX = 0, inicioY = 0, dx = 0, dy = 0;
    el.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' || e.button !== 0) return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        inicioX = e.clientX - dx;
        inicioY = e.clientY - dy;
        el.style.zIndex = ++camada;
        el.classList.add('arrastando');
    });
    el.addEventListener('pointermove', e => {
        if (!el.hasPointerCapture(e.pointerId)) return;
        dx = e.clientX - inicioX;
        dy = e.clientY - inicioY;
        el.style.translate = `${dx}px ${dy}px`;
    });
    const soltar = () => el.classList.remove('arrastando');
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
});

/* Marca-texto do menu desliza até a seção que está na tela. */
const menu = document.querySelector('.menu');
const marcador = menu.querySelector('.marcador');
const linksMenu = new Map([...menu.querySelectorAll('a')].map(a => [a.hash.slice(1), a]));
let ativo = linksMenu.get('inicio');

function marcar(link) {
    ativo = link;
    linksMenu.forEach(a => a === link ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
    marcador.style.translate = link.offsetLeft + 'px 0';
    marcador.style.width = link.offsetWidth + 'px';
}

const espiao = new IntersectionObserver(entradas => entradas.forEach(({ target, isIntersecting }) => {
    // seções sem link no menu (habilidades, formação, contato) mantêm o anterior marcado
    if (isIntersecting && linksMenu.has(target.id)) marcar(linksMenu.get(target.id));
}), { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main > section[id]').forEach(s => espiao.observe(s));
marcar(ativo);
document.fonts.ready.then(() => marcar(ativo)); // a largura dos links muda quando a fonte carrega
addEventListener('resize', () => marcar(ativo));

/* Blocos aparecem quando entram na tela. */
const revelar = new IntersectionObserver(entradas => entradas.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    target.classList.add('visto');
    revelar.unobserve(target);
}), { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.revelar').forEach(el => revelar.observe(el));

/* Vídeos: tocam quando aparecem, param quando saem, e têm botão próprio de pausa. */
const ICONES = {
    pausar: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3" width="3" height="10" rx="1"/><rect x="9.5" y="3" width="3" height="10" rx="1"/></svg>',
    tocar: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5z"/></svg>',
};

const naTela = new IntersectionObserver(entradas => entradas.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting && !v.dataset.pausado) v.play().catch(() => {});
    else v.pause();
}), { threshold: 0.35 });

document.querySelectorAll('.midia video').forEach(v => {
    v.controls = false;
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'tocar';
    const atualizar = () => {
        botao.innerHTML = v.paused ? ICONES.tocar : ICONES.pausar;
        botao.setAttribute('aria-label', v.paused ? 'Reproduzir vídeo' : 'Pausar vídeo');
    };
    const alternar = () => {
        if (v.paused) { delete v.dataset.pausado; v.play().catch(() => {}); }
        else { v.dataset.pausado = '1'; v.pause(); }
    };
    v.addEventListener('play', atualizar);
    v.addEventListener('pause', atualizar);
    v.addEventListener('click', alternar);
    botao.addEventListener('click', alternar);
    v.after(botao);
    atualizar();
    if (calmo) v.dataset.pausado = '1'; // quem pediu menos movimento dá o play se quiser
    naTela.observe(v);
});

/* Copiar e-mail */
const copiar = document.querySelector('.copiar');
if (navigator.clipboard) {
    copiar.hidden = false;
    copiar.addEventListener('click', () => {
        navigator.clipboard.writeText(document.querySelector('.email').textContent.trim()).then(() => {
            copiar.textContent = 'Copiado!';
            copiar.dataset.ok = '';
            setTimeout(() => { copiar.textContent = 'Copiar'; delete copiar.dataset.ok; }, 2000);
        }, () => {});
    });
}
