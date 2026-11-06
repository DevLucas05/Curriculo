// Movimento do site. É tudo acabamento: sem este arquivo a página continua completa.
const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('ano').textContent = new Date().getFullYear();

/* Texto "decodificando", como a resposta de um modelo chegando. */
const SIMBOLOS = 'abcdefghijklmnopqrstuvwxyz0123456789#%&*+=<>/';

function decodificar(el, de, para, duracao) {
    return new Promise(fim => {
        const t0 = performance.now();
        requestAnimationFrame(function passo(t) {
            const p = Math.min(1, Math.max(0, (t - t0) / duracao));
            const tamanho = Math.round(de.length + (para.length - de.length) * p);
            const prontos = Math.floor(para.length * p);
            let s = para.slice(0, prontos);
            for (let i = prontos; i < tamanho; i++) s += para[i] === ' ' ? ' ' : SIMBOLOS[Math.random() * SIMBOLOS.length | 0];
            el.textContent = s;
            p < 1 ? requestAnimationFrame(passo) : fim();
        });
    });
}

const hero = document.querySelector('.hero');

if (!calmo) {
    const nome = hero.querySelector('h1');
    const texto = nome.textContent;
    nome.style.minHeight = nome.offsetHeight + 'px'; // os símbolos têm larguras diferentes; a altura não pula
    decodificar(nome, texto, texto, 900).then(() => { nome.style.minHeight = ''; });

    const giro = hero.querySelector('.giro');
    const frases = ['agentes no AWS Bedrock', 'RAG e LLMs', 'Flutter offline-first', 'Go e análise estática'];
    let atual = 0;
    setInterval(() => {
        const de = frases[atual];
        atual = (atual + 1) % frases.length;
        decodificar(giro, de, frases[atual], 650);
    }, 3200);
}

/* Campo de pontos do topo: os pontos fogem do cursor e acendem em areia; um clique ou toque
   solta uma onda. Sem cursor (celular, mouse parado), o foco passeia sozinho. */
if (!calmo) {
    const campo = hero.querySelector('.campo');
    const ctx = campo.getContext('2d');
    const ESPACO = 28, RAIO = 190, AREIA = '#dcb783', NEUTRO = '#89939e', VIDA_ONDA = 1800;
    let pontos = [], larg = 0, alt = 0, cursor = null, ultimoMovimento = -Infinity, foco = null, forca = 0.45;
    const ondas = [];

    function medir() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        larg = campo.clientWidth;
        alt = campo.clientHeight;
        campo.width = Math.round(larg * dpr);
        campo.height = Math.round(alt * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        pontos = [];
        for (let y = (alt % ESPACO) / 2; y < alt; y += ESPACO)
            for (let x = (larg % ESPACO) / 2; x < larg; x += ESPACO) pontos.push(x, y);
        desenhar(performance.now());
    }

    function desenhar(t) {
        const solto = !cursor || t - ultimoMovimento > 2500;
        const alvoX = solto ? larg * (0.6 + 0.28 * Math.sin(t / 5300)) : cursor.x;
        const alvoY = solto ? alt * (0.5 + 0.3 * Math.sin(t / 3900)) : cursor.y;
        if (!foco) foco = { x: alvoX, y: alvoY };
        foco.x += (alvoX - foco.x) * 0.06;
        foco.y += (alvoY - foco.y) * 0.06;
        while (ondas.length && t - ondas[0].t > VIDA_ONDA) ondas.shift();
        // passeando sozinho, a luz é mais fraca para não brigar com o texto
        forca += ((solto ? 0.45 : 1) - forca) * 0.05;

        ctx.clearRect(0, 0, larg, alt);
        for (let i = 0; i < pontos.length; i += 2) {
            const px = pontos[i], py = pontos[i + 1];
            const dx = px - foco.x, dy = py - foco.y, d = Math.hypot(dx, dy) || 1;
            let f = Math.max(0, 1 - d / RAIO);
            f = f * f * (3 - 2 * f) * forca;
            let x = px + dx / d * f * 14, y = py + dy / d * f * 14, brilho = f;

            for (const o of ondas) {
                const ox = px - o.x, oy = py - o.y, od = Math.hypot(ox, oy) || 1, idade = t - o.t;
                const b = Math.exp(-(((od - idade * 0.55) / 26) ** 2)) * (1 - idade / VIDA_ONDA);
                x += ox / od * b * 9;
                y += oy / od * b * 9;
                brilho = Math.max(brilho, b);
            }

            const aceso = brilho > 0.03;
            ctx.globalAlpha = aceso ? Math.min(1, 0.25 + brilho * 0.75)
                : 0.24 + 0.1 * Math.sin(t / 1500 + px * 0.013 + py * 0.021);
            ctx.fillStyle = aceso ? AREIA : NEUTRO;
            ctx.beginPath();
            ctx.arc(x, y, 1 + brilho * 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function posicao(e) {
        const r = campo.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    hero.addEventListener('pointermove', e => {
        cursor = posicao(e);
        ultimoMovimento = performance.now();
        // a foto e a moldura usam isto para o efeito de profundidade
        const h = hero.getBoundingClientRect();
        hero.style.setProperty('--px', ((e.clientX - h.left) / h.width * 2 - 1).toFixed(3));
        hero.style.setProperty('--py', ((e.clientY - h.top) / h.height * 2 - 1).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
        ultimoMovimento = -Infinity;
        hero.style.removeProperty('--px');
        hero.style.removeProperty('--py');
    });
    hero.addEventListener('pointerdown', e => ondas.push({ ...posicao(e), t: performance.now() }));

    // só anima enquanto o topo está visível
    let visivel = false, rodando = false;
    function quadro(t) {
        if (!visivel) { rodando = false; return; }
        desenhar(t);
        requestAnimationFrame(quadro);
    }
    new IntersectionObserver(([e]) => {
        visivel = e.isIntersecting;
        if (visivel && !rodando) { rodando = true; requestAnimationFrame(quadro); }
    }).observe(hero);
    new ResizeObserver(medir).observe(campo);

    // uma onda de boas-vindas quando a página abre
    setTimeout(() => ondas.push({ x: larg * 0.3, y: alt * 0.55, t: performance.now() }), 450);
}

/* Vídeos: tocam quando aparecem na tela, param quando saem, e têm botão próprio de pausa. */
const ICONES = {
    pausar: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3" width="3" height="10" rx="1"/><rect x="9.5" y="3" width="3" height="10" rx="1"/></svg>',
    tocar: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5z"/></svg>',
};

const naTela = new IntersectionObserver(entradas => entradas.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting && !v.dataset.pausado) v.play().catch(() => {});
    else v.pause();
}), { threshold: 0.35 });

document.querySelectorAll('.tela video').forEach(v => {
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

/* Menu do topo marca a seção que está na tela. */
const linksMenu = new Map([...document.querySelectorAll('.topo nav a')].map(a => [a.hash.slice(1), a]));
const espiao = new IntersectionObserver(entradas => entradas.forEach(({ target, isIntersecting }) => {
    // Formação não tem link no menu: ali o menu mantém a seção anterior marcada
    if (!isIntersecting || !(linksMenu.has(target.id) || target.id === 'inicio')) return;
    linksMenu.forEach((a, id) => id === target.id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
}), { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main > section[id]').forEach(s => espiao.observe(s));

/* Copiar e-mail */
const copiar = document.querySelector('.copiar');
if (navigator.clipboard) {
    copiar.hidden = false;
    copiar.addEventListener('click', () => {
        navigator.clipboard.writeText(document.querySelector('.email').textContent.trim()).then(() => {
            copiar.textContent = 'Copiado';
            copiar.dataset.ok = '';
            setTimeout(() => { copiar.textContent = 'Copiar e-mail'; delete copiar.dataset.ok; }, 2000);
        }, () => {});
    });
}
