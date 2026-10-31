(() => {
  'use strict';
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
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
  applyTheme(store.get('kaixer-theme') === 'dark' ? 'dark' : 'light');
  themeButton.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);store.set('kaixer-theme',theme);
  });

  const sidebar = document.getElementById('sidebar');
  const toggle = document.querySelector('.menu-toggle');
  const backdrop = document.querySelector('.menu-backdrop');
  const mobile = matchMedia('(max-width: 760px)');
  const page = document.getElementById('main');
  const content = document.querySelector('.content');
  const showreel = document.getElementById('showreelVideo');
  let side = 'dev';
  let sideAnimation;
  function setSide(next, {scroll = true, updateUrl = true, animate = true} = {}) {
    next = next === 'creative' ? 'creative' : 'dev';
    const changed = next !== side;
    hideGuide({immediate:true});
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
    if(changed&&animate&&!calm.matches)sideAnimation=content.animate([{opacity:.25,transform:'translateY(12px)',filter:'blur(3px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0px)'}],{duration:580,easing:'cubic-bezier(.22,1,.36,1)'});
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
    hideGuide();
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
  function setMenu(open, restoreFocus = false, {tour=false} = {}) {
    if(open&&!tour)hideGuide();
    sidebar.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    backdrop.hidden = !open;
    if (mobile.matches) sidebar.inert = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const open=toggle.getAttribute('aria-expanded') !== 'true';
    if(!open)hideGuide();
    setMenu(open);
  });
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
      await navigator.clipboard.writeText('businesskaixer@gmail.com');button.textContent='Copied';announce('Email address copied.');
    } catch {
      const range=document.createRange();range.selectNodeContents(document.querySelector('.email-row a'));
      const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
      button.textContent='Selected';announce('Email address selected. Use your device’s copy command.');
    }
    setTimeout(()=>{button.textContent='Copy';},2500);
  });

  // Cursor movement and bubble resizing share an interruptible spring clock.
  const guide=document.getElementById('guide');
  const cursor=document.getElementById('guideCursor');
  const guideText=document.getElementById('guideText');
  const guideNext=guide.querySelector('[data-guide-next]');
  const guideBack=guide.querySelector('[data-guide-back]');
  const guidePause=guide.querySelector('[data-guide-pause]');
  const guideCount=document.getElementById('guideCount');
  const guideSubject=document.getElementById('guideSubject');
  const welcome=document.getElementById('welcome');
  const sections=[...document.querySelectorAll('section[data-guide]')];
  const isVisible=element=>element&&!element.closest('[hidden]')&&element.getClientRects().length;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  let active=false,paused=false,steps=[],step=0,target=null,animationFrame=0,lastFrame=0,readTime=0;
  let shown={x:0,y:0,vx:0,vy:0},tourFocus=null,welcomeAnimation=null,welcomeExit=null,welcomeRunning=false;
  let textAnimation=null,tourMenu=false;
  const pad=guide.querySelector('.guide-pad');
  const textMeasure=document.createElement('canvas').getContext('2d');
  let panel={width:236,height:144,vw:0,vh:0},panelGoal={width:236,height:144};
  const tourLinks=[...sidebar.querySelectorAll('nav a,nav button')];
  tourLinks.forEach((link,index)=>{link.dataset.tourLink=String(index);});
  const tabDescriptions={
    '#projects':['Projects','Explore the apps I’ve built and their code.'],
    '#about':['About','A little about me and what I’m working toward.'],
    '#education':['Education','My studies and the journey so far.'],
    '#stack':['Stack & tools','The languages and tools I work with.'],
    '#highlights':['Highlights','Research, awards, and a few milestones.'],
    '#contact':['Contact','Have an idea? Here’s where to reach me.'],
    '#video':['Showreel','Watch heyIMKAI to see my editing in motion.'],
    '#services':['Services','Explore editing services and packages.'],
    'order.html':['Start a project','Open the booking page when you’re ready.'],
    'resume':['Resume','Open my full resume here, anytime.']
  };
  const getSteps=()=>[
    ['.side-switch','Start here.','Developer for apps. Creative for film and editing.'],
    ...tourLinks.filter(isVisible).map(link=>{
      const key=link.getAttribute('href')||'resume';
      const [title,text]=tabDescriptions[key];
      return [`[data-tour-link="${link.dataset.tourLink}"]`,title,text];
    })
  ];
  function setPaused(value){
    paused=value;guidePause.textContent=paused?'Play':'Pause';
    guidePause.setAttribute('aria-label',paused?'Play tour':'Pause tour');
  }
  function hideGuide(){
    active=false;cancelAnimationFrame(animationFrame);animationFrame=0;textAnimation?.cancel();
    target?.classList.remove('guide-target');cursor.hidden=true;
    if(tourMenu){tourMenu=false;setMenu(false);}
    const hadFocus=guide.contains(document.activeElement);
    guide.hidden=true;root.classList.remove('tour-active');root.style.removeProperty('--guide-space');
    if(hadFocus){
      const fallback=isVisible(tourFocus)&&tourFocus.matches('button,a[href],[tabindex]')&&!tourFocus.closest('[inert]')?tourFocus:page;
      fallback.focus({preventScroll:true});
    }
  }
  function sizePanel(){
    if(!active)return;
    const frame=page.getBoundingClientRect();
    if(textMeasure)textMeasure.font=getComputedStyle(guideText).font;
    const textWidth=textMeasure?.measureText(steps[step][2]).width||steps[step][2].length*6;
    const width=Math.min(clamp(Math.round(124+textWidth*.5),218,284),frame.width-32);
    pad.style.width=`${width-2}px`;
    panelGoal={width,height:Math.ceil(pad.getBoundingClientRect().height)+2};
    if(calm.matches)panel={...panelGoal,vw:0,vh:0};
  }
  function moveToTarget(behavior=calm.matches?'instant':'smooth'){
    if(!target)return;
    if(step===0){page.scrollTo({top:0,behavior:'instant'});return;}
    if(sidebar.contains(target)){
      const navFrame=sidebar.getBoundingClientRect(),navRect=target.getBoundingClientRect();
      if(navRect.top<navFrame.top+18||navRect.bottom>navFrame.bottom-48){
        sidebar.scrollTo({top:Math.max(0,sidebar.scrollTop+navRect.top-navFrame.top-36),behavior});
      }
      const href=target.getAttribute('href');
      if(href?.startsWith('#')){
        const section=document.querySelector(href),frame=page.getBoundingClientRect();
        const heading=section?.querySelector('.section-heading')||section;
        if(heading)page.scrollTo({top:Math.max(0,page.scrollTop+heading.getBoundingClientRect().top-frame.top-38),behavior});
      }
      return;
    }
    const frame=page.getBoundingClientRect(),rect=target.getBoundingClientRect();
    const required=rect.height+panelGoal.height+78;
    const offset=Math.max(22,Math.min(68,(frame.height-required)/2));
    page.scrollTo({top:Math.max(0,page.scrollTop+rect.top-frame.top-offset),behavior});
  }
  function placeCursor(){
    const rect=target.getBoundingClientRect();
    const navigation=sidebar.contains(target);
    const pageFrame=page.getBoundingClientRect();
    const frame=navigation?{left:mobile.matches?0:sidebar.getBoundingClientRect().left,right:pageFrame.right,top:pageFrame.top,bottom:pageFrame.bottom,width:pageFrame.right-(mobile.matches?0:sidebar.getBoundingClientRect().left)}:pageFrame;
    return {
      x:clamp(rect.right-6,navigation?frame.left+12:frame.left+panelGoal.width-4,frame.right-27),
      y:clamp(rect.bottom+9,frame.top+12,frame.bottom-panelGoal.height-42),
      frame,rect,navigation
    };
  }
  function drawGuide(now){
    if(!active)return;
    const delta=Math.min(now-(lastFrame||now),32);lastFrame=now;
    if(!document.hidden){
      // A delayed browser fragment/scroll restoration must not move the opening step.
      // Wheel, touch, keyboard and navigation input dismiss the guide before browsing.
      if(step===0&&page.scrollTop!==0)page.scrollTo({top:0,behavior:'instant'});
      const position=placeCursor();
      if(calm.matches){shown.x=position.x;shown.y=position.y;shown.vx=0;shown.vy=0;}
      else{
        const ticks=Math.max(1,Math.ceil(delta/6)),dt=delta/ticks/1000;
        for(let i=0;i<ticks;i++){
          shown.vx+=(110*(position.x-shown.x)-19.5*shown.vx)*dt;
          shown.vy+=(110*(position.y-shown.y)-19.5*shown.vy)*dt;
          shown.x+=shown.vx*dt;shown.y+=shown.vy*dt;
          // Unequal springs give the bubble a soft stretch-and-settle motion.
          // Preserve velocity between steps so interrupted transitions stay fluid.
          panel.vw+=(170*(panelGoal.width-panel.width)-18*panel.vw)*dt;
          panel.vh+=(130*(panelGoal.height-panel.height)-15.5*panel.vh)*dt;
          panel.width+=panel.vw*dt;panel.height+=panel.vh*dt;
        }
      }
      cursor.style.transform=`translate3d(${shown.x.toFixed(2)}px,${shown.y.toFixed(2)}px,0)`;
      if(calm.matches)panel={...panelGoal,vw:0,vh:0};
      panel.width=Math.min(panel.width,position.frame.width-26);
      const bx=clamp(position.navigation&&!mobile.matches?shown.x+25:shown.x-panel.width+6,position.frame.left+12,position.frame.right-panel.width-12);
      const by=clamp(shown.y+29,position.frame.top+12,position.frame.bottom-panel.height-12);
      guide.style.transform=`translate3d(${bx.toFixed(2)}px,${by.toFixed(2)}px,0)`;
      guide.style.width=`${panel.width.toFixed(2)}px`;guide.style.height=`${panel.height.toFixed(2)}px`;
      const softness=calm.matches?0:Math.min(10,(Math.abs(panel.vw)+Math.abs(panel.vh))/70);
      guide.style.borderRadius=`${18+softness}px 5px ${18+softness*.7}px ${18+softness*1.2}px`;
      // Keep the cursor out of the chrome while its target scrolls into view.
      cursor.style.opacity=position.rect.bottom>position.frame.top&&position.rect.top<position.frame.bottom?'1':'0';
      if(!paused){
        readTime+=delta;
        const duration=4300+steps[step][2].length*23;
        guide.style.setProperty('--tour-progress',String(Math.min(1,readTime/duration)));
        if(readTime>=duration){advanceStep();if(!active)return;}
      }
    }
    animationFrame=requestAnimationFrame(drawGuide);
  }
  function tourStep(){
    target?.classList.remove('guide-target');
    const entry=steps[step];
    if(!entry){finishTour();return;}
    target=document.querySelector(entry[0]);
    const openNavigation=mobile.matches&&sidebar.contains(target);
    if(openNavigation){tourMenu=true;setMenu(true,false,{tour:true});}
    else if(tourMenu){tourMenu=false;setMenu(false);}
    if(!isVisible(target)){finishTour();return;}
    target.classList.add('guide-target');
    guideSubject.textContent=entry[1];guideText.textContent=entry[2];
    guideCount.textContent=`${step+1} / ${steps.length}`;
    guideNext.textContent=step===steps.length-1?'Done ✓':'Next →';guideBack.disabled=step===0;
    readTime=0;guide.style.setProperty('--tour-progress','0');
    sizePanel();moveToTarget();
    if(!calm.matches){panel.vw+=28;panel.vh-=44;}
    textAnimation?.cancel();
    if(!calm.matches)textAnimation=guide.querySelector('.guide-message').animate([
      {opacity:0,transform:'translateY(7px)',filter:'blur(2px)'},
      {opacity:1,transform:'translateY(0)',filter:'blur(0px)'}
    ],{duration:580,delay:170,fill:'backwards',easing:'cubic-bezier(.16,1,.3,1)'});
    announce(`Tour ${step+1} of ${steps.length}. ${entry[1]}. ${entry[2]}`);
  }
  function startTour({origin=null}={}){
    hideGuide();setMenu(false);
    if(search.open||cv.open)return;
    tourFocus=document.activeElement;steps=getSteps();step=0;
    window.scrollTo({top:0,behavior:'instant'});
    page.scrollTo({top:0,behavior:'instant'});sidebar.scrollTo({top:0,behavior:'instant'});
    const tourUrl=new URL(location.href);tourUrl.hash='home';
    if(side==='creative')tourUrl.searchParams.set('side','creative');
    history.replaceState({side},'',tourUrl);
    root.style.removeProperty('--guide-space');root.classList.add('tour-active');
    guide.hidden=false;cursor.hidden=false;active=true;setPaused(calm.matches);
    tourStep();const position=placeCursor();
    shown={x:origin?.x??position.x+30,y:origin?.y??position.y+30,vx:0,vy:0};
    panel=calm.matches?{...panelGoal,vw:0,vh:0}:{width:104,height:44,vw:0,vh:0};
    guide.style.opacity='1';
    guide.style.width=`${panel.width}px`;guide.style.height=`${panel.height}px`;
    cursor.style.transform=`translate3d(${shown.x}px,${shown.y}px,0)`;
    lastFrame=0;animationFrame=requestAnimationFrame(drawGuide);
  }
  function finishTour(){hideGuide();root.style.removeProperty('--guide-space');announce('You’re all set. Explore at your own pace.');}
  function advanceStep(){if(step<steps.length-1){step++;tourStep();}else finishTour();}
  function dismissGuide(){hideGuide();root.style.removeProperty('--guide-space');announce('Tour skipped. Explore at your own pace.');}
  document.querySelectorAll('[data-tour-start]').forEach(button=>button.addEventListener('click',()=>startTour()));
  guideNext.addEventListener('click',advanceStep);
  guideBack.addEventListener('click',()=>{if(step>0){step--;tourStep();}});
  guidePause.addEventListener('click',()=>setPaused(!paused));
  guide.querySelector('[data-guide-close]').addEventListener('click',dismissGuide);
  document.addEventListener('focusin',event=>{if(active&&event.target.matches(':focus-visible')&&event.target!==guidePause)setPaused(true);});
  // Intentional browsing always takes precedence over the automatic tour.
  page.addEventListener('wheel',()=>{if(active)dismissGuide();},{passive:true});
  page.addEventListener('touchmove',()=>{if(active)dismissGuide();},{passive:true});
  document.addEventListener('pointerdown',event=>{if(active&&!event.target.closest('#guide,[data-tour-start],.menu-toggle'))dismissGuide();});
  document.addEventListener('keydown',event=>{
    if(active&&['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].includes(event.key)&&!guide.contains(event.target)&&!event.target.matches('input,textarea,button'))dismissGuide();
  });

  let scrollFrame=null;
  const navLinks=[...sidebar.querySelectorAll('a[href^="#"]')];
  function updateScroll(){
    scrollFrame=null;let currentSection=sections[0];
    const frame=page.getBoundingClientRect();
    sections.forEach(section=>{if(isVisible(section)&&section.getBoundingClientRect().top<=frame.top+frame.height*.36)currentSection=section;});
    if(page.scrollTop+page.clientHeight>=page.scrollHeight-3)currentSection=sections.filter(isVisible).at(-1)||currentSection;
    navLinks.forEach(link=>{if(link.hash===`#${currentSection.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});

  }
  page.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});
  function reflowGuide(){if(active){
    if(mobile.matches&&sidebar.contains(target)){tourMenu=true;setMenu(true,false,{tour:true});}
    else if(tourMenu){tourMenu=false;setMenu(false);}
    sizePanel();moveToTarget('instant');
  }}
  window.addEventListener('resize',()=>{reflowGuide();updateScroll();});
  window.visualViewport?.addEventListener('resize',reflowGuide);
  calm.addEventListener('change',()=>{
    if(active){setPaused(true);reflowGuide();}
    if(welcomeRunning&&calm.matches)finishWelcome(true);
  });
  const initialSide=sideForHash(location.hash)||(new URL(location.href).searchParams.get('side')==='creative'?'creative':'dev');
  setSide(initialSide,{scroll:false,updateUrl:false,animate:false});
  history.scrollRestoration='manual';
  page.scrollTo({top:0,behavior:'instant'});

  function finishWelcome(runTour){
    if(!welcomeRunning)return;
    const entry=welcome.querySelector('.welcome-cursor').getBoundingClientRect();
    welcomeRunning=false;welcomeAnimation?.cancel();welcomeExit?.cancel();
    welcome.close();welcome.classList.remove('is-drawing');
    if(!calm.matches)content.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:800,easing:'cubic-bezier(.22,1,.36,1)'});
    if(runTour)startTour({automatic:true,origin:{x:entry.x,y:entry.y}});
  }
  async function playWelcome(){
    if(calm.matches){startTour({automatic:true});return;}
    welcomeRunning=true;welcome.showModal();welcome.classList.add('is-drawing');
    const title=document.getElementById('welcomeTitle').getBoundingClientRect();
    const point=(x,y,rotate=0)=>`translate3d(${clamp(x,16,innerWidth-94)}px,${clamp(y,16,innerHeight-90)}px,0) rotate(${rotate}deg)`;
    // A single sampled curve avoids stop/start velocity at intermediate keyframes.
    const start={x:Math.max(20,title.left-100),y:title.bottom+95};
    const end={x:title.right+12,y:title.bottom+16};
    const c1={x:title.left+title.width*.4,y:title.bottom+15};
    const c2={x:title.right+75,y:title.bottom+90};
    const frames=Array.from({length:81},(_,i)=>{
      const t=i/80,u=t*t*t*(t*(t*6-15)+10),v=1-u;
      const x=v*v*v*start.x+3*v*v*u*c1.x+3*v*u*u*c2.x+u*u*u*end.x;
      const y=v*v*v*start.y+3*v*v*u*c1.y+3*v*u*u*c2.y+u*u*u*end.y;
      return {transform:point(x,y,-7*(1-u)),opacity:Math.min(1,t*5),offset:t};
    });
    welcomeAnimation=welcome.querySelector('.welcome-cursor').animate(frames,
      {duration:2400,easing:'linear',fill:'forwards'});
    if(document.hidden)welcomeAnimation.pause();
    try{
      await welcomeAnimation.finished;
      if(!welcomeRunning)return;
      welcomeExit=welcome.animate([{opacity:1},{opacity:0}],{duration:480,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
      await welcomeExit.finished;
      finishWelcome(true);
    }catch{/* Skipping or changing motion preferences cancels the entrance. */}
  }
  welcome.querySelector('.welcome-skip').addEventListener('click',()=>finishWelcome(true));
  welcome.addEventListener('cancel',event=>{event.preventDefault();finishWelcome(false);});
  document.addEventListener('visibilitychange',()=>{
    root.classList.toggle('page-hidden',document.hidden);
    if(welcomeRunning){
      const animation=welcomeExit||welcomeAnimation;
      if(document.hidden)animation?.pause();else animation?.play();
    }
  });
  // Every document visit/reload gets the entrance; in-page navigation never repeats it.
  playWelcome();

  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();search.open?search.close():openSearch();}
    if(event.key==='Escape'&&cv.classList.contains('open')){window.closeCv();return;}
    if(event.key==='Tab'&&mobile.matches&&sidebar.classList.contains('is-open')){
      const controls=[toggle,...sidebar.querySelectorAll('a[href],button'),...(tourMenu?[...guide.querySelectorAll('button:not(:disabled)')]:[])].filter(el=>!el.closest('[hidden]'));
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
    document.querySelectorAll('.page-section .section-heading,.projects-intro,.project-row,.page-section>p,.feature-title,.showreel-player,.about-facts,.cv-edu-item,.stack-item,.tools-list,.highlights-list li,.service-row,.package-row,.email-row').forEach(el=>{
      if(el.closest('.cv-modal'))return;
      el.classList.add('reveal');
      if(el.matches('.stack-item,.project-row'))el.style.setProperty('--reveal-delay',`${[...el.parentElement.children].indexOf(el)%2*90}ms`);
      observer.observe(el);
    });
    root.classList.add('motion-enabled');
  }

  // Pointer lighting and gentle device rotation share one scheduled update.
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  const glow=document.querySelector('.desktop-glow');
  let glowFrame=0,pointerX=innerWidth*.7,pointerY=innerHeight*.22,activeStage=null;
  function resetStage(){
    activeStage?.style.removeProperty('--tilt-x');
    activeStage?.style.removeProperty('--tilt-y');
    activeStage=null;
  }
  document.addEventListener('pointermove',event=>{
    if(calm.matches||!finePointer.matches)return;
    pointerX=event.clientX;pointerY=event.clientY;
    const stage=event.target.closest('.project-stage');
    if(stage!==activeStage){resetStage();activeStage=stage;}
    if(glowFrame)return;
    glowFrame=requestAnimationFrame(()=>{
      glowFrame=0;
      glow.style.setProperty('--glow-x',`${pointerX}px`);
      glow.style.setProperty('--glow-y',`${pointerY}px`);
      if(activeStage){
        const rect=activeStage.getBoundingClientRect();
        activeStage.style.setProperty('--tilt-x',`${8-(pointerY-rect.top-rect.height/2)/rect.height*12}deg`);
        activeStage.style.setProperty('--tilt-y',`${(pointerX-rect.left-rect.width/2)/rect.width*28}deg`);
      }
    });
  },{passive:true});
  document.addEventListener('pointerleave',resetStage);
  calm.addEventListener('change',resetStage);
  finePointer.addEventListener('change',resetStage);
  // Float only while a project is visible; no continuous work off screen.
  if('IntersectionObserver' in window){
    const portrait=document.querySelector('.portrait');
    const portraitObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-away',!entry.isIntersecting)),{root:page});
    portraitObserver.observe(portrait);
    const devices=new IntersectionObserver(entries=>entries.forEach(entry=>{
      entry.target.querySelector('.device-float').style.animationPlayState=entry.isIntersecting&&!document.hidden?'running':'paused';
    }));
    document.querySelectorAll('.project-stage').forEach(stage=>devices.observe(stage));
    document.addEventListener('visibilitychange',()=>{
      document.querySelectorAll('.project-stage').forEach(stage=>{
        const rect=stage.getBoundingClientRect();
        stage.querySelector('.device-float').style.animationPlayState=!document.hidden&&rect.bottom>0&&rect.top<innerHeight?'running':'paused';
      });
    });
  }
})();
