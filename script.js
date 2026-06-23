// ==========================================
const SUPABASE_URL = 'https://vvrjpofqkksemwmqwxyi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cmpwb2Zxa2tzZW13bXF3eHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjUwODIsImV4cCI6MjA5Nzc0MTA4Mn0.0EPKmEfvCscMaWxbXfsou5GestDWDPALJrhshIj9nww';
// ==========================================
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function carregarConfiguracao() {
    const { data, error } = await supabaseClient.from('config').select('*').eq('id', 1).single();
    if (error && error.code === 'PGRST116') return null; // Tabela vazia
    return data;
}

async function carregarDados() {
    const config = await carregarConfiguracao();
    const { data: posts } = await supabaseClient.from('posts').select('*').order('data', { ascending: false });
    const { data: rascunhos } = await supabaseClient.from('rascunhos').select('*').order('data', { ascending: false });
    return { config, posts: posts || [], rascunhos: rascunhos || [] };
}

async function iniciar() {
    const dados = await carregarDados();
    
    // Se não existir config no banco, usa padrão
    const config = dados.config || { 
        blog_name: 'jaun', home_title: 'Últimos Artigos', home_intro: 'Hi, I\'m jaun. Welcome to my scientific blog.', 
        page_title_posts: 'Posts', page_title_rascunhos: 'Rascunhos', footer_text: '' 
    };
    
    const path = window.location.pathname;
    let pageSuffix = "Home";
    if (path.includes('posts')) pageSuffix = config.page_title_posts || "Posts";
    else if (path.includes('rascunhos')) pageSuffix = config.page_title_rascunhos || "Rascunhos";
    
    document.title = config.blog_name + " - " + pageSuffix;

    const siteTitleEl = document.querySelector('.site-title');
    if(siteTitleEl) siteTitleEl.innerText = config.blog_name;

    const footerEl = document.querySelector('footer p');
    if(footerEl) footerEl.innerText = config.footer_text || "";

    const h2Tags = document.querySelectorAll('main h2');

    if (path.includes('index') || path === '/') {
        if(h2Tags.length > 0 && config.home_title) h2Tags[0].innerText = config.home_title;
        else if(h2Tags.length > 0) h2Tags[0].style.display = 'none';

        const introEl = document.getElementById('home-intro');
        if(introEl && config.home_intro) introEl.innerText = config.home_intro;
        else if(introEl) introEl.style.display = 'none';

        const container = document.getElementById('home-carousel');
        if(container) container.innerHTML = dados.posts.slice(0, 3).map(p => criarCardPost(p)).join('');
    } else if (path.includes('posts')) {
        if(h2Tags.length > 0 && config.page_title_posts) h2Tags[0].innerText = config.page_title_posts;
        else if(h2Tags.length > 0) h2Tags[0].style.display = 'none';
        const container = document.getElementById('all-posts-list');
        if(container) container.innerHTML = dados.posts.map(p => criarCardPost(p, false)).join('');
    } else if (path.includes('rascunhos')) {
        if(h2Tags.length > 0 && config.page_title_rascunhos) h2Tags[0].innerText = config.page_title_rascunhos;
        else if(h2Tags.length > 0) h2Tags[0].style.display = 'none';
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
        await supabaseClient.from(tabela).update({ likes: current + 1 }).eq('id', id);
    }
}

document.addEventListener('DOMContentLoaded', iniciar);
