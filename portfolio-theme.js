(() => {
  'use strict';
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key,value) { try { localStorage.setItem(key,value); } catch {} }
  };
  const announce = text => { document.getElementById('announcement').textContent = text; };
  const themeButton = document.querySelector('.theme-toggle');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    document.querySelector('[data-theme-label]').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    document.querySelector('[data-theme-icon]').textContent = theme === 'dark' ? '☼' : '☾';
  }
  applyTheme(store.get('kaixer-theme') === 'light' ? 'light' : 'dark');
  themeButton.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);store.set('kaixer-theme',theme);
  });

  const sidebar = document.getElementById('sidebar');
  const toggle = document.querySelector('.menu-toggle');
  const backdrop = document.querySelector('.menu-backdrop');
  const mobile = matchMedia('(max-width: 760px)');
  const compactGuide = matchMedia('(max-width: 1099px)');
  const page = document.getElementById('main');
  const content = document.querySelector('.content');
  const showreel = document.getElementById('showreelVideo');
  let side = 'dev';
  let sideAnimation;
  function setSide(next, {scroll = true, updateUrl = true, animate = true} = {}) {
    next = next === 'creative' ? 'creative' : 'dev';
    const changed = next !== side;
    hideGuide();removeHighlight();hovering=false;mode='explore';step=0;
    side = next;root.dataset.side = side;
    document.querySelectorAll('[data-side-only]').forEach(el => {el.hidden=el.dataset.sideOnly!==side;});
    document.querySelectorAll('[data-side-switch]').forEach(button => {button.setAttribute('aria-pressed',String(button.dataset.sideSwitch===side));});
    document.getElementById('sideCaption').textContent=side==='dev'?'Code, data & decisions':'Film, motion & storytelling';
    const visibleSections=sections.filter(section=>!section.hidden&&section.id!=='home');
    visibleSections.forEach((section,index)=>{
      const heading=section.querySelector('.section-heading h2');
      const label=heading.textContent.replace(/^\d+\s*\u2014\s*/,'');
      heading.textContent=`${String(index+1).padStart(2,'0')} — ${label}`;
    });
    if(side==='dev')showreel.pause();
    if(updateUrl){
      const url=new URL(location.href);
      if(side==='creative')url.searchParams.set('side','creative');else url.searchParams.delete('side');
      url.hash='home';history.pushState({side},'',url);
    }
    if(scroll){window.scrollTo({top:0,behavior:'instant'});page.scrollTo({top:0,behavior:'instant'});}
    sideAnimation?.cancel();
    if(changed&&animate&&!calm.matches)sideAnimation=content.animate([{opacity:.2,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:350,easing:'cubic-bezier(.2,.7,.2,1)'});
    updateScroll();
    if(changed)announce(`${side==='dev'?'Developer':'Creative'} side selected.`);
  }
  document.querySelectorAll('[data-side-switch]').forEach(button=>button.addEventListener('click',()=>{setMenu(false);setSide(button.dataset.sideSwitch);}));
  function sideForHash(hash){
    const el=document.getElementById(hash.replace(/^#/,''));
    return el?.closest('[data-side-only]')?.dataset.sideOnly;
  }
  function navigateHash(){
    const requested=sideForHash(location.hash)||(new URL(location.href).searchParams.get('side')==='creative'?'creative':'dev');
    if(requested!==side)setSide(requested,{scroll:false,updateUrl:false});
    document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant',block:'start'});
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const requested=sideForHash(link.hash);
    if(requested&&requested!==side)setSide(requested,{scroll:false,updateUrl:false});
  });
  window.addEventListener('hashchange',()=>{const requested=sideForHash(location.hash);if(requested&&requested!==side){setSide(requested,{scroll:false,updateUrl:false});document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant'});}});
  window.addEventListener('popstate',navigateHash);
  showreel.addEventListener('error',()=>{document.getElementById('videoError').hidden=false;});
  showreel.querySelector('source').addEventListener('error',()=>{document.getElementById('videoError').hidden=false;});
  const playShowreel=document.getElementById('playShowreel');
  playShowreel.addEventListener('click',async()=>{
    playShowreel.disabled=true;
    try{await showreel.play();}
    catch{document.getElementById('videoError').hidden=false;}
    finally{playShowreel.disabled=false;}
  });
  showreel.addEventListener('play',()=>{hideGuide();playShowreel.hidden=true;document.getElementById('videoError').hidden=true;});
  showreel.addEventListener('ended',()=>{playShowreel.hidden=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)showreel.pause();});
  function setMenu(open, restoreFocus = false) {
    sidebar.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    backdrop.hidden = !open;
    if (mobile.matches) sidebar.inert = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  backdrop.addEventListener('click', () => setMenu(false,true));
  sidebar.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => setMenu(false)));
  mobile.addEventListener('change', () => {setMenu(false);sidebar.inert = mobile.matches;});
  sidebar.inert = mobile.matches;

  // Resume behavior is separate from the booking page and its EmailJS integration.
  const cv = document.getElementById('cvModal');
  const originalOpen = window.openCv, originalClose = window.closeCv;
  let cvFocus;
  window.openCv = () => {
    cvFocus = document.activeElement;setMenu(false);
    cv.inert = false;originalOpen();if(!cv.open)cv.showModal();
    requestAnimationFrame(() => { if (cv.classList.contains('open')) cv.querySelector('.cv-close').focus(); });
    hideGuide();
  };
  window.closeCv = () => { originalClose();if(cv.open)cv.close();cv.inert = true;if (cvFocus && !cvFocus.closest('[inert]')) cvFocus.focus();else if(mobile.matches)toggle.focus(); };
  cv.addEventListener('cancel',event=>{event.preventDefault();window.closeCv();});
  cv.addEventListener('keydown', event => {
    if (event.key === 'Escape') {event.preventDefault();event.stopPropagation();window.closeCv();}
    if (event.key !== 'Tab') return;
    const controls = [...cv.querySelectorAll('button,a[href],[tabindex="0"]')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault();last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault();first.focus(); }
  });

  const search = document.getElementById('searchDialog');
  const searchInput = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  const entries = [
    ['Home','#home','About Kaixer, developer, student'],
    ['BaliTrip','#projects','Travel, AHP, mobile app'],
    ['KiloWatch','#projects','Energy, decision support'],
    ['Video editing','#video','Film, showreel, motion, samples'],
    ['Services & packages','#services','Pricing, color, sound, freelance'],
    ['Start a project','order.html','Booking, order, project brief'],
    ['About','#about','Bio, location, availability'],
    ['Education','#education','University, schools, computer science'],
    ['Stack & tools','#stack','Python, JavaScript, Adobe, Premiere'],
    ['Highlights','#highlights','Awards, research, achievements'],
    ['Contact','#contact','Email, GitHub, LinkedIn'],
    ['Resume','resume','CV, qualifications, PDF']
  ];
  function renderSearch() {
    const query = searchInput.value.trim().toLowerCase();
    const found = entries.filter(entry => entry.join(' ').toLowerCase().includes(query));
    results.replaceChildren();
    found.forEach(([label,href,description]) => {
      const item = document.createElement(href === 'resume' ? 'button' : 'a');
      if (href !== 'resume') item.href = href;
      else item.type = 'button';
      item.append(document.createTextNode(label));
      const detail = document.createElement('small');
      detail.textContent = href === 'order.html' ? 'booking ↗' : href === 'resume' ? 'open CV ↗' : 'jump to ↗';
      item.append(detail);
      item.addEventListener('click', () => {search.close();if (href === 'resume') window.openCv();});
      results.append(item);
    });
    if (!found.length) {
      const message = document.createElement('p');message.className='empty-result';message.textContent='No matches. Try “video”, “projects”, or “contact”.';results.append(message);
    }
  }
  function openSearch() {setMenu(false);hideGuide();searchInput.value='';renderSearch();search.showModal();searchInput.focus();}
  document.querySelectorAll('[data-search-open]').forEach(button=>button.addEventListener('click',openSearch));
  document.querySelector('[data-search-close]').addEventListener('click',()=>search.close());
  searchInput.addEventListener('input',renderSearch);
  searchInput.addEventListener('keydown',event=>{
    if (event.key==='ArrowDown') {event.preventDefault();results.querySelector('a,button')?.focus();}
    if (event.key==='Enter') {event.preventDefault();results.querySelector('a,button')?.click();}
  });
  search.addEventListener('click',event=>{if(event.target===search){const r=search.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)search.close();}});

  document.querySelector('[data-copy-email]').addEventListener('click',async event=>{
    const button=event.currentTarget;
    try {
      if(!navigator.clipboard)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('kaixermalvar@gmail.com');button.textContent='Copied';announce('Email address copied.');
    } catch {
      const range=document.createRange();range.selectNodeContents(document.querySelector('.email-row a'));
      const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
      button.textContent='Selected';announce('Email address selected. Use your device’s copy command.');
    }
    setTimeout(()=>{button.textContent='Copy';},2500);
  });

  // The explanation lives in its own rail. Only its connector reaches the target.
  const guide=document.getElementById('guide');
  const guideText=document.getElementById('guideText');
  const guideNext=document.querySelector('[data-guide-next]');
  const guideCount=document.getElementById('guideCount');
  const guideSubject=document.getElementById('guideSubject');
  const connector=document.getElementById('guideConnector');
  const guideLine=document.getElementById('guideLine');
  const sections=[...document.querySelectorAll('[data-guide]')].filter(el=>el.tagName==='SECTION');
  const allSteps=[
    ['#intro-name','Hi! I’m Kaixer. Welcome to my little corner of the internet.'],
    ['.portrait','That’s me. I’m a Computer Science student based in the Philippines.'],
    ['.intro-stats[data-side-only="dev"]','Development comes first here: my apps, Computer Science background, and what I’m learning.'],
    ['.intro-stats[data-side-only="creative"]','I’ve spent 10 years editing videos — 5 of them professionally. Watch the showreel below.'],
    ['#projects .section-heading','These are my development projects. Each one links to its code on GitHub.'],
    ['#showreel','Press play to watch heyIMKAI. You can change the volume, seek, or watch fullscreen.'],
    ['#services .section-heading','Explore my services and starting prices. The booking page keeps your project brief in one place.'],
    ['#about .section-heading','A little more about me, what I’m learning, and the problems I like to work on.'],
    ['#education .section-heading','My education, from my early school years to Computer Science at Batangas State University.'],
    ['#stack .section-heading','These are the languages and editing tools I work with. I’m always learning.'],
    ['#highlights .section-heading','A few milestones from research, editing, and school. My full resume is in the sidebar.'],
    ['#contact .section-heading','Have something in mind? Email me here, or start a project. Thanks for looking around!']
  ];
  function getSteps(){return allSteps.filter(([selector])=>{const el=document.querySelector(selector);return el&&!el.closest('[hidden]')&&el.getClientRects().length;});}
  const sectionMessages={home:allSteps[0][1],projects:'These are my development projects. Each one links to its code on GitHub.',video:'This is my creative side. Watch heyIMKAI in the player below.',services:'Editing services live on this side. The booking page keeps your project brief in one place.',about:'A little more about me, what I’m learning, and the problems I like to work on.',education:'My education, from my early school years to Computer Science at Batangas State University.',stack:'The languages or creative tools I’m currently working with.',highlights:'A few milestones from research, editing, and school. My full resume is in the navigation.',contact:'Have something in mind? Email me here. Thanks for looking around!'};
  let dismissed=store.get('kaixer-guide-dismissed')==='yes';
  let mode='explore',step=0,target=null,typing=0,hovering=false,lastMessage='',ready=false;
  let compactActive=false;
  function syncGuideViewport(){
    const shouldDock=compactGuide.matches&&!guide.hidden;
    root.style.setProperty('--guide-height',`${guide.offsetHeight}px`);
    if(shouldDock===compactActive)return;
    if(shouldDock){
      const previousScroll=window.scrollY;
      root.classList.add('guide-docked');compactActive=true;
      window.scrollTo({top:0,behavior:'instant'});page.scrollTop=previousScroll;
    }else{
      const previousScroll=page.scrollTop;
      root.classList.remove('guide-docked');compactActive=false;
      window.scrollTo({top:previousScroll,behavior:'instant'});
    }
  }
  function hideGuide(){guide.hidden=true;connector.hidden=true;guide.classList.remove('is-visible');clearInterval(typing);removeHighlight();syncGuideViewport();}
  function placeGuide(){
    if(!target||guide.hidden)return;
    if(target.closest('[hidden]')||!target.getClientRects().length){hideGuide();return;}
    syncGuideViewport();
    const rect=target.getBoundingClientRect();
    const height=guide.offsetHeight;
    if(compactGuide.matches){guide.style.removeProperty('top');connector.hidden=true;return;}
    const minTop=mobile.matches?90:32;
    const y=Math.max(minTop,Math.min(innerHeight-height-24,rect.top+rect.height/2-height/2));
    guide.style.top=`${y}px`;
    const visible=rect.top>=minTop&&rect.top<innerHeight-20&&rect.right<guide.getBoundingClientRect().left-14;
    if(!visible||sidebar.contains(target)){connector.hidden=true;return;}
    const bubble=guide.getBoundingClientRect();
    const contentRect=content.getBoundingClientRect();
    const startX=bubble.left-7,startY=bubble.top+Math.min(45,bubble.height/2);
    const gutterX=Math.max(contentRect.right+8,startX-24);
    const endX=rect.right+5,endY=rect.top-5;
    const elbowY=Math.max(minTop-12,rect.top-20);
    connector.hidden=false;
    const connectorBounds=connector.getBoundingClientRect();
    connector.setAttribute('viewBox',`0 0 ${connectorBounds.width} ${connectorBounds.height}`);
    guideLine.setAttribute('d',`M ${startX} ${startY} H ${gutterX} V ${elbowY} H ${endX} V ${endY}`);
  }
  function showGuide(element,text,nextMode=mode){
    if(dismissed||search.open||cv.classList.contains('open')||!element)return;
    removeHighlight();target=element;mode=nextMode;guide.dataset.mode=mode;guide.hidden=false;guide.classList.add('is-visible');
    element.classList.add('guide-target');
    const section=element.closest('section');
    guideSubject.textContent=element.id==='showreel'?'heyIMKAI / showreel':element.closest('.side-switch')?'Dev / Creative':section?.id==='home'?(element.classList.contains('portrait')?'About Kaixer':element.classList.contains('intro-stats')?'At a glance':'Welcome'):section?.querySelector('h2')?.textContent.replace(/^\d+\s*\u2014\s*/,'')||element.textContent.trim();
    const steps=getSteps();
    guideCount.textContent=mode==='tour'?`${step+1} / ${steps.length}`:'Scroll to explore';
    guideNext.textContent=mode==='tour'?(step===steps.length-1?'Finish ✓':'Next →'):'Take tour →';
    if(text!==lastMessage){
      clearInterval(typing);lastMessage=text;guideText.style.minHeight='34px';guideText.textContent=text;
      const textHeight=guideText.offsetHeight;guideText.style.minHeight=`${textHeight}px`;
      if(!calm.matches){let index=0;guideText.textContent='';typing=setInterval(()=>{index+=2;guideText.textContent=text.slice(0,index);if(index>=text.length)clearInterval(typing);},24);}
    }
    placeGuide();
  }
  function removeHighlight(){document.querySelectorAll('.guide-target').forEach(el=>el.classList.remove('guide-target'));}
  function tourStep(){
    removeHighlight();
    const steps=getSteps();
    const [selector,text]=steps[step];const element=document.querySelector(selector);
    element.classList.add('guide-target');
    showGuide(element,text,'tour');
    element.scrollIntoView({behavior:calm.matches?'instant':'smooth',block:'center'});
    announce(`Tour step ${step+1} of ${steps.length}. ${text}`);
  }
  function startTour(){setMenu(false);dismissed=false;ready=true;store.set('kaixer-guide-dismissed','no');step=0;mode='tour';tourStep();}
  document.querySelectorAll('[data-tour-start]').forEach(button=>button.addEventListener('click',startTour));
  guideNext.addEventListener('click',()=>{
    if(mode!=='tour'){startTour();return;}
    if(step<getSteps().length-1){step++;tourStep();}
    else{removeHighlight();mode='explore';hideGuide();announce('Tour complete.');}
  });
  function dismissGuide(){dismissed=true;store.set('kaixer-guide-dismissed','yes');removeHighlight();hideGuide();announce('Guide dismissed. You can replay it from the navigation.');}
  document.querySelector('[data-guide-close]').addEventListener('click',dismissGuide);
  document.querySelectorAll('[data-tip]').forEach(element=>{
    element.addEventListener('pointerenter',()=>{if(!ready||!fine.matches||mode==='tour'||dismissed)return;hovering=true;showGuide(element,element.dataset.tip,'context');});
    element.addEventListener('pointerleave',()=>{if(mode==='tour')return;hovering=false;mode='explore';hideGuide();});
  });
  let scrollFrame=null,current='home';
  const navLinks=[...sidebar.querySelectorAll('a[href^="#"]')];
  function updateScroll(){
    scrollFrame=null;let active=sections[0];
    sections.forEach(section=>{if(!section.hidden&&section.getClientRects().length&&section.getBoundingClientRect().top<=innerHeight*.42)active=section;});
    navLinks.forEach(link=>{if(link.hash===`#${active.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    if(active.id!==current){
      current=active.id;
      if(ready&&!dismissed&&mode!=='tour'&&!hovering&&fine.matches)showGuide(active.querySelector('.section-heading')||document.getElementById('intro-name'),sectionMessages[current],'explore');
    }
    if(!guide.hidden)placeGuide();
  }
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});
  page.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});
  window.addEventListener('resize',()=>{placeGuide();updateScroll();});
  document.fonts?.ready.then(placeGuide);
  new ResizeObserver(()=>{if(!guide.hidden){syncGuideViewport();placeGuide();}}).observe(guide);
  compactGuide.addEventListener('change',()=>{syncGuideViewport();placeGuide();});
  const initialSide=sideForHash(location.hash)||(new URL(location.href).searchParams.get('side')==='creative'?'creative':'dev');
  setSide(initialSide,{scroll:false,updateUrl:false,animate:false});
  if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant'}));
  setTimeout(()=>{
    ready=true;
    if(dismissed||compactGuide.matches)return;
    const steps=getSteps();
    const initialTarget=location.hash&&location.hash!=='#home'?document.querySelector(`${location.hash} .section-heading`):document.getElementById('intro-name');
    showGuide(initialTarget||document.getElementById('intro-name'),sectionMessages[location.hash.slice(1)]||steps[0][1],'intro');
    if(!fine.matches||calm.matches)return;
    [1,2].forEach((index)=>setTimeout(()=>{
      if(mode!=='intro'||dismissed||document.hidden||scrollY>100||page.scrollTop>100)return;
      const element=document.querySelector(steps[index][0]);
      const rect=element.getBoundingClientRect();
      if(rect.top>0&&rect.bottom<innerHeight)showGuide(element,steps[index][1],'intro');
    },index*6500));
    setTimeout(()=>{if(mode==='intro'){mode='explore';guide.dataset.mode='explore';}},20000);
  },1400);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInterval(typing);guideText.textContent=lastMessage;}});
  calm.addEventListener('change',()=>{clearInterval(typing);guideText.textContent=lastMessage;placeGuide();});
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();search.open?search.close():openSearch();}
    if(event.key==='Escape'&&cv.classList.contains('open')){window.closeCv();return;}
    if(event.key==='Tab'&&mobile.matches&&sidebar.classList.contains('is-open')){
      const controls=[toggle,...sidebar.querySelectorAll('a[href],button')].filter(el=>!el.closest('[hidden]'));
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    if(event.key==='Escape'&&!cv.classList.contains('open')&&!search.open){
      if(toggle.getAttribute('aria-expanded')==='true')setMenu(false,true);
      else if(!guide.hidden)dismissGuide();
    }
  });
  if(!calm.matches&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-in');observer.unobserve(entry.target);}}),{threshold:.06});
    document.querySelectorAll('.page-section .section-heading,.project-row,.reel-note,.package-row').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
    root.classList.add('motion-enabled');
  }
})();
