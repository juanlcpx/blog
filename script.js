// ==========================================
// COLE SUA URL E KEY DO SUPABASE AQUI!
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_KEY = 'SUA_KEY_ANON_PUBLIC_AQUI';
// ==========================================

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function carregarDados() {
    const { data: posts } = await supabase.from('posts').select('*').order('data', { ascending: false });
    const { data: rascunhos } = await supabase.from('rascunhos').select('*').order('data', { ascending: false });
    return { posts: posts || [], rascunhos: rascunhos || [] };
}

async function iniciar() {
    const dados = await carregarDados();
    const path = window.location.pathname;

    if (path.includes('index') || path === '/' || path === '/index.html') {
        const container = document.getElementById('home-carousel');
        if(container) container.innerHTML = dados.posts.slice(0, 3).map(p => criarCardPost(p)).join('');
    } else if (path.includes('posts')) {
        const container = document.getElementById('all-posts-list');
        if(container) container.innerHTML = dados.posts.map(p => criarCardPost(p, false)).join('');
    } else if (path.includes('rascunhos')) {
        const container = document.getElementById('rascunhos-timeline');
        if(container) container.innerHTML = dados.rascunhos.map(r => criarTweetRascunho(r)).join('');
    }
}

function criarCardPost(post, isCarousel = true) {
    return `<div class="${isCarousel ? 'card' : 'post-item'}">
        <a href="${post.pdf_url || '#'}" target="_blank">
            <img src="${post.imagem_url || 'https://via.placeholder.com/400x200/eee/999?text=Sem+Imagem'}" alt="Capa do Post">
            <div class="card-title">${post.titulo}</div>
            <div style="color:#555; font-size:0.9rem;">${post.resumo}</div>
            <div class="card-date">${post.data}</div>
        </a>
        <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 10px;">
            <button class="like-btn" onclick="curtir('posts', ${post.id})">♥ <span id="like_posts_${post.id}">${post.likes || 0}</span></button>
            ${post.pdf_url ? `<a href="${post.pdf_url}" target="_blank" style="font-size:0.8rem; background:#eee; padding: 0.2rem 0.8rem; border-radius: 12px;">📄 Baixar PDF</a>` : ''}
        </div>
    </div>`;
}

function criarTweetRascunho(rascunho) {
    const imagensHtml = (rascunho.imagens || []).map(img => `<img src="${img}" alt="ilustração">`).join('');
    return `<div class="rascunho-card">
        <div class="rascunho-text">${rascunho.texto}</div>
        ${imagensHtml ? `<div class="rascunho-imgs">${imagensHtml}</div>` : ''}
        <span class="rascunho-date">${rascunho.data}</span>
        <div style="margin-top: 0.5rem;">
            <button class="like-btn" onclick="curtir('rascunhos', ${rascunho.id})">♥ <span id="like_rascunhos_${rascunho.id}">${rascunho.likes || 0}</span></button>
        </div>
    </div>`;
}

async function curtir(tabela, id) {
    if(!localStorage.getItem(`liked_${tabela}_${id}`)) {
        const span = document.getElementById(`like_${tabela}_${id}`);
        let current = parseInt(span.innerText) || 0;
        span.innerText = current + 1;
        localStorage.setItem(`liked_${tabela}_${id}`, true);
        document.querySelector(`button[onclick="curtir('${tabela}', ${id})"]`).classList.add('liked');
        
        await supabase.from(tabela).update({ likes: current + 1 }).eq('id', id);
    }
}

document.addEventListener('DOMContentLoaded', iniciar);