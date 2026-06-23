const SUPABASE_URL = 'https://vvrjpofqkksemwmqwxyi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cmpwb2Zxa2tzZW13bXF3eHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjUwODIsImV4cCI6MjA5Nzc0MTA4Mn0.0EPKmEfvCscMaWxbXfsou5GestDWDPALJrhshIj9nww';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const PADRAO = { blog_name: 'jaun', home_title: 'Últimos Artigos', home_intro: 'Hi, I\'m jaun.', page_title_posts: 'Posts', page_title_rascunhos: 'Rascunhos', footer_text: '' };

async function iniciar() {
    try {
        // Busca config (se falhar, usa o padrão)
        let config = PADRAO;
        const { data } = await supabaseClient.from('config').select('*').eq('id', 1).maybeSingle();
        if (data) config = data;

        // Busca dados
        const { data: posts } = await supabaseClient.from('posts').select('*').order('data', { ascending: false });
        const { data: rascunhos } = await supabaseClient.from('rascunhos').select('*').order('data', { ascending: false });

        // Atualiza DOM
        document.title = config.blog_name;
        const t = document.querySelector('.site-title');
        if(t) t.innerText = config.blog_name;
        
        const f = document.querySelector('footer p');
        if(f) f.innerText = config.footer_text || "";

        const path = window.location.pathname;

        if (path.includes('index') || path === '/') {
            document.getElementById('page-title').innerText = config.home_title;
            const intro = document.getElementById('home-intro');
            if(intro && config.home_intro) intro.innerText = config.home_intro;
            const container = document.getElementById('home-carousel');
            if(container && posts.length > 0) container.innerHTML = posts.slice(0,3).map(p => criarCardPost(p)).join('');
            else if(container) container.innerHTML = "<p style='color:#888;'>Nenhum post publicado ainda. Vá no admin!</p>";
        } else if (path.includes('posts')) {
            document.getElementById('page-title').innerText = config.page_title_posts;
            const container = document.getElementById('all-posts-list');
            if(container && posts.length > 0) container.innerHTML = posts.map(p => criarCardPost(p, false)).join('');
            else if(container) container.innerHTML = "<p style='color:#888;'>Nenhum post publicado ainda.</p>";
        } else if (path.includes('rascunhos')) {
            document.getElementById('page-title').innerText = config.page_title_rascunhos;
            const container = document.getElementById('rascunhos-timeline');
            if(container && rascunhos.length > 0) container.innerHTML = rascunhos.map(r => criarTweetRascunho(r)).join('');
            else if(container) container.innerHTML = "<p style='color:#888;'>Nenhum rascunho postado ainda.</p>";
        }
    } catch (e) {
        alert("Erro geral detectado! Verifique o console (F12). Erro: " + e.message);
    }
}

function criarCardPost(post, isCarousel = true) {
    return `<div class="${isCarousel ? 'card' : 'post-item'}">
        <a href="${post.pdf_url || '#'}" target="_blank">
            <img src="${post.imagem_url || 'https://via.placeholder.com/400x200/eee/999?text=Sem+Imagem'}" alt="Capa">
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
