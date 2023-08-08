class Knob extends HTMLElement {

  template = `
  <svg xmlns="http://www.w3.org/2000/svg" 
    xmlns:xlink="http://www.w3.org/1999/xlink"   
     width="60" height="60" viewBox="0 0 120 140">  
    <circle cx="60" cy="60" r="50" fill="none" transform="rotate(150,60,60)" stroke="#E1E1E1" stroke-width="14" stroke-dashoffset="105" stroke-dasharray="314" />
    <circle cx="60" cy="60" r="50" transform="rotate(150,60,60)" fill="none" stroke-dashoffset="314" stroke-dasharray="314"  
       stroke="dodgerblue" stroke-width="14" style='filter: blur(0.5px);'/>
    <circle  cx="60" cy="60" r="43"  fill="#4a4a4a" stroke='none'/>
    <rect  width='4%' height='10%' fill='white' x='48%' y='15%' transform="rotate(-120,60,60)"/>
  </svg>
  <span contenteditable style='white-space: nowrap;display: flex;justify-content: center;overflow-wrap:normal;position:absolute;width:100%;left:0;bottom:0;font-family:arial;color:#717171;font-size:2em;'>kto</span>
  `
  static options = {
    mode:{
      unipolar:'unipolar',
      bipolar:'bipolar'
    },
    scale:{
      linear:'linear',
      log:'log',
    },
  }

  constructor(inputConfig = {}) {
    super();
    
    this.shadow = this.attachShadow({mode:'closed'})
    this.shadow.innerHTML = this.template

    this.style.position = 'relative';
    this.style.display = 'inline-block'

    const defaultAttributes = {
      step: null,
      min: 0,
      max: 100,
      progresscolor: 'dodgerblue',
      size:1,
      scale: 'linear',
      unit: '%',
      name:'knob',
      mode:'unipolar',
      enablezero:'true',
      hideminus:'false'
    }

    this.config = Object.create(defaultAttributes)
    Object.assign(this.config,inputConfig)
  } 

  static get observedAttributes() {
    return ['min','max','unit','scale','progresscolor','fontcolor','trackcolor',
            'pointercolor','knobcolor','size','step','name','leftunit','rightunit','fontsize'];
  }

  connectedCallback(){
      
    for(let attribute in this.config){
        if(!this.attributes.hasOwnProperty(attribute) && attribute!='name'){this.setAttribute(attribute,this.config[attribute])}
    } 

    if(this.attributes['min'].value <= 0 && this.attributes['scale'].value == 'log'){throw new Error('logarithmic scale doesnt work with negative values');}
    
    if(this.attributes['mode'].value == 'bipolar'){
      this.setAttribute('fakemin',this.attributes['min'].value)
      this.setAttribute('min',-(this.attributes['max'].value))
    }

    const inputEvent = new Event("input");
    const changeEvent = new Event("change");


    const valueIndicator = this.shadow.querySelectorAll('circle')[1]
    const knob = this.shadow.querySelectorAll('circle')[2]
    const pointer = this.shadow.querySelectorAll('rect')[0]
    const text = this.shadow.querySelectorAll('span')[0]
    
    
    this.textContent = this.textContent || this.attributes['name']?.value || this.config['name']
    text.innerHTML = this.textContent 

    text.style.userSelect = 'none'


    const elem = this

    const attr = elem.attributes

    elem.value = 0

    let value=0;
    let innerValue=0;
    
    let oldValueInput = null;
    let oldValueChange = null;

    let oldValue = 0

    let lastMousePosition = null; 

    let isChanging = false
    let keyboardInput = false

    let timer

   function filterTextInput(string){

      string = string.trimLeft().trimRight().replace(/ /g,'')

      let value

      let sign = 1;

      function exactCompare(str1,str2){
        return str1 == str2
      }

      function anyCaseCompare(str1,str2){
        return str1.toLowerCase() == str2.toLowerCase()
      }

      function findUnique(str1,str2){
         return [...str1].reduce((acc,char)=>{
             if(str2.toLowerCase().includes(char.toLowerCase())){return acc}else{
              return acc+char
             } 
         },'')
      }
      function calculateSimilarity(str1,str2){
        return [...str1].reduce((acc,char)=>{
             if(str2.toLowerCase().includes(char.toLowerCase())){return acc+1}else{
              return acc
             } 
         },0)
      }

      function getSign(currentSign,leftUnit,rightUnit,string,hasDigit,hasMinus){

        if(hasMinus && elem.value > 0){return -1}

        if(!hasDigit){string = string.replace(/[0-9.-]/g,'');}


        if(rightUnit === '' || leftUnit === ''){return currentSign}
        if(string === ''){return currentSign}
          
        if(exactCompare(string,leftUnit)){return -1}
        if(exactCompare(string,rightUnit)){return 1}
        if(anyCaseCompare(string,leftUnit)){return -1}
        if(anyCaseCompare(string,leftUnit)){return 1}


        let leftUnique = findUnique(leftUnit,rightUnit)
        let rightUnique = findUnique(rightUnit,leftUnit)

        let leftUniqueSimilarity = calculateSimilarity(string,leftUnique) 
        let rightUniqueSimilarity = calculateSimilarity(string,rightUnique)
      
        if(leftUniqueSimilarity > 1 && leftUniqueSimilarity > rightUniqueSimilarity){return -1}
        if(rightUniqueSimilarity > 1 && leftUniqueSimilarity < rightUniqueSimilarity){return 1}


        let leftSimilarity = calculateSimilarity(string,leftUnit) 
        let rightSimilarity = calculateSimilarity(string,rightUnit)

        if(leftSimilarity > 0 && leftSimilarity > rightSimilarity){return -1}
        if(rightSimilarity > 0 && leftSimilarity < rightSimilarity){return 1}

        return currentSign     
      }

     if(attr['mode'].value == 'bipolar' && attr['leftunit'].value && attr['leftunit'].value){

      let leftStr = attr['leftunit'].value.replace(/ /g,'')
      let rightStr = attr['rightunit'].value .replace(/ /g,'')

      const unitsHasDigit = /\d/.test(leftStr) || /\d/.test(rightStr)
      const digitIsFirst = /\d/.test(leftStr[0]) || /\d/.test(rightStr[0])
      const hasMinus = string.startsWith('-')

      if(unitsHasDigit && digitIsFirst){
        if(string.includes(leftStr)){
             value = parseFloat(string.slice(0,string.indexOf(leftStr)))
        }else if(string.includes(rightStr)){
             value = parseFloat(string.slice(0,string.indexOf(rightStr)))
        }else{
             value = parseFloat(string)
        }
      }else{
         value = parseFloat(string)
      }
        value = Math.abs(value) * getSign(Math.sign(value),leftStr,rightStr,string,unitsHasDigit,hasMinus)
     }else{

      let unitStr = attr['unit'].value.replace(/ /g,'')
      const unitsHasDigit = /\d/.test(unitStr)
      const digitIsFirst = /\d/.test(unitStr)
      
      if(unitsHasDigit && digitIsFirst){
        if(string.includes(unitStr)){
             value = parseFloat(string.slice(0,string.indexOf(unitStr)))
            }
      }else{
         value = parseFloat(string)
      }

     }

     return value
   }

   function filterZero(value){
      if(value == 0 && attr['enablezero'].value == 'false' && attr['mode'].value == 'bipolar'){
        let newValue = attr['fakemin'].value * Math.sign(oldValueInput);
        return newValue
      }else return value
   }

   function userLogarithmToInner(value){
      let min = Math.log10(Number(attr['min'].value) || 1)
      let max = Math.log10(Number(attr['max'].value) || 1)

      if(attr['mode'].value == 'bipolar'){
        if(value == 0){return 0.5}
        let sign = Math.sign(value)
        min = Math.log10(Number(attr['fakemin'].value))
        return 0.5 + ((Math.log10(Math.abs(value)) - min) / (max-min))*sign/2
        } 
      return roundTo(Math.log10(value) - min) / (max-min) 
    }
    function innerToUserLogarithm(value){
      let sign = 1
      let min = Math.log10(Number(attr['min'].value) || 1)
      let max = Math.log10(Number(attr['max'].value) || 1)

      if(attr['mode'].value == 'bipolar'){
         if(value == 0.5){return 0}
         min =  Math.log10(Number(attr['fakemin'].value))
         sign = Math.sign(value-0.5)
         return (10 ** (Math.abs(value-0.5) * 2 * (max-min) + min))*sign
      }

      return roundTo(10 ** (value * (max-min) + min))*sign  
    }

    function toStep(value){
      if(attr['step'].value == 'null'){return value}
      let step = Number(attr['step'].value)
      return Math.round(value/step)*step
    }

    function clamp(value,min=0,max=1){
      return Math.min(Math.max(value,min),max)
    }

    function roundTo(value,digit = 10){
      return Math.round(value*10**digit)/10**digit
    }

    function convertToUserScale(value){
      if(attr['scale'].value == 'log'){
        return innerToUserLogarithm(value)
      }
      return roundTo(value * (Number(attr['max'].value)-Number(attr['min'].value)) + Number(attr['min'].value),10)
    }

    function convertUserToInner(value){
      if(attr['scale'].value == 'log'){
        return userLogarithmToInner(value)
      }
       value = roundTo(value,10)
       value = (Number(value) - Number(attr['min'].value)) / (Number(attr['max'].value)-Number(attr['min'].value))
       return clamp(value)
    }

    function showValue(){
      let unit
      let needDifferentUnit = Boolean(attr['mode'].value == 'bipolar' && attr['leftunit']?.value && attr['rightunit']?.value);
      if(needDifferentUnit){
          unit = innerValue < 0.5 ? attr['leftunit'].value : attr['rightunit'].value;
      }else{
          unit = attr['unit'].value
      }

      let value = attr['hideminus'].value == 'true' ? Math.abs(elem.value) : elem.value;

      text.innerHTML = value + unit
    }

    function showName(){
      text.innerHTML = `${elem.textContent}`
    }

    function calculateNewValue(difference){     
      return clamp(innerValue + difference*0.01);
    }

    function restoreValue(){
      setValue(convertUserToInner(oldValue) || 0,true)
      setTimeout(showName,200)
    }

    function dispatchInputEvent(){
      if(elem.value != oldValueInput){
             elem.dispatchEvent(inputEvent)
             oldValueInput = elem.value
          }
    }
    function dispatchChangeEvent(){
      if(elem.value != oldValueChange){
             elem.dispatchEvent(changeEvent)
             oldValue = oldValueChange
             oldValueChange = elem.value
          }
    }

    function setValue(newValue,isChange){
        innerValue = clamp(roundTo(newValue,10))        
        elem.value = roundTo(clamp(filterZero(toStep(convertToUserScale(innerValue))),attr['min'].value,attr['max'].value))

        dispatchInputEvent()
        isChange && dispatchChangeEvent()

        updateUI()  
    }

    function outerSetValue(value){
        setValue(convertUserToInner(parseFloat(value)))
        setTimeout(showName,0)
    }


    function updateUI(){
      requestAnimationFrame(()=>{     
        if(attr['mode'].value == 'bipolar'){
          let angle = clamp((convertUserToInner(elem.value)*240),-60,120) ;
          let progress = Math.abs((convertUserToInner(elem.value)-0.5)*210)
           valueIndicator.setAttribute('transform',`rotate(${150+angle},60,60)`)
           valueIndicator.setAttribute('stroke-dashoffset',314-progress)
        }else{
           valueIndicator.setAttribute('stroke-dashoffset',314-convertUserToInner(elem.value)*210)
        }
        pointer.setAttribute('transform',`rotate(${innerValue*240-120},60,60)`)
        showValue()
      })
    }

    function handleMousedown(e){
        if(e.button != 0){return}

        document.addEventListener('mousemove',handleMousemove)
        document.addEventListener('mouseup',handleMouseup)

        isChanging = true
        text.removeAttribute('contenteditable')
    }
    function handleMouseup(e){
        if(e.button != 0){return}

        document.removeEventListener('mousemove',handleMousemove)
        document.removeEventListener('mouseup',handleMouseup)
         
        dispatchChangeEvent()
       
        lastMousePosition = null

        isChanging = false
        text.setAttribute('contenteditable',true)
  
        setTimeout(showName,50)
    }
    function handleMousemove(e){
      if(lastMousePosition !== null){
         let dif = lastMousePosition-e.clientY
         setValue(calculateNewValue(dif),false)
      }
      lastMousePosition = e.clientY 
    }
    function handleMousewheel(e){
       setValue(calculateNewValue(-e.deltaY/50),true)
       clearTimeout(timer)
       timer = setTimeout(showName,350)
    }

    function handleDoubleclick(e){
       e.preventDefault()
       restoreValue()
    }

    function handleMouseover(e){
       if(!isChanging){
         text.addEventListener('keydown',handleKeydown)
         showValue()
       }

    }
    function handleMouseout(e){
       text.removeEventListener('keydown',handleKeydown)
       if(keyboardInput){
         setValue(convertUserToInner(filterTextInput(e.target.innerHTML)),true)
       }
       setTimeout(showName,50)
       text.blur()
       keyboardInput = false
    }

    function handleKeydown(e){
       if(e.key == 'Enter'){
        setValue(convertUserToInner(filterTextInput(e.target.innerHTML)),true)
        e.target.blur()
        keyboardInput = false
       }
    }

    
    knob.addEventListener('mousedown',handleMousedown)
    knob.addEventListener('mousewheel',handleMousewheel)
    knob.addEventListener('contextmenu',handleDoubleclick)

    text.addEventListener('mouseover',handleMouseover)
    text.addEventListener('mouseout',handleMouseout)
    text.addEventListener('input',e=>keyboardInput = true)

    this.addEventListener("dragstart",e=>{
       e.preventDefault();
    })

    elem.set = outerSetValue;

    attr['mode'].value == 'bipolar' && setValue(0.5)
    setTimeout(showName,10)

  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch(name){
      case 'progresscolor':{
            this.shadow.querySelectorAll('circle')[1].setAttribute('stroke',newValue)
      } break;
      case 'trackcolor':{
            this.shadow.querySelectorAll('circle')[0].setAttribute('stroke',newValue)
      } break;
      case 'knobcolor':{
            this.shadow.querySelectorAll('circle')[2].setAttribute('fill',newValue)
      } break;
      case 'pointercolor':{
            this.shadow.querySelectorAll('rect')[0].setAttribute('fill',newValue)
      } break;
      case 'fontcolor':{
            this.shadow.querySelectorAll('span')[0].style.color = newValue
      } break;
      case 'size':{
            this.shadow.querySelectorAll('svg')[0].setAttribute('width',60*newValue)
            this.shadow.querySelectorAll('svg')[0].setAttribute('height',60*newValue)
            this.shadow.querySelectorAll('span')[0].style.fontSize = `${15*newValue}px`
      } break;
      case 'name':{
            this.textContent = newValue
      } break;   
      case 'fontsize':{
        this.shadow.querySelectorAll('span')[0].style.fontSize = `${newValue}`
      } break; 
    }  
  }
}
