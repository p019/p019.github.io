class TextController {
	constructor(){
        this.typed=0;
	   this.currentRow=0;
	   this.rowsOnScreen=[];
	   this.lettersOnScreen=[];
	   this.shift=0;
	   this.chapterShift=0;
	   this.lettersBeforeShift=0;
	   this.timings=[];	
        this.text=text.replaceAll(`\n`,'');
	   this.textBlockElem=document.getElementById('textBlock');
	   this.symbolsInRow=50;
	   this.started = false
	   this.ended = false
	}
	
	type() {
     
          document.getElementById('restartButton').classList.remove('hidden')

          if(!this.ended){

		this.lettersOnScreen[this.typed].classList.remove('untyped')
		this.lettersOnScreen[this.typed].classList.add('typed')
		this.typed++

		if(this.lettersBeforeShift == 0){
			this.nextRow()
			this.lettersBeforeShift = this.rowsOnScreen[2].innerText.length+1
		}
		this.lettersBeforeShift--

		let time = new Date
		this.timings.push(time)

          }


	}
	nextRow(){
		this.addNewRow()
		this.shiftText()
		
		
	}
	deleteOldRow(){
		this.rowsOnScreen[0].remove()
		this.rowsOnScreen.shift()
	}
	shiftText(){

		this.textBlockElem.classList.add('move')

	}
	addNewRow(){
		let row = this.getRow(this.currentRow)

		this.lettersOnScreen.push(...row)

		let rowElem  = document.createElement('p');

		row.forEach(elem=>{rowElem.appendChild(elem)})

		this.textBlockElem.appendChild(rowElem)

		this.rowsOnScreen.push(rowElem)

		this.currentRow++

	}
	getRow(n){
		let rowText = this.text.slice(n*this.symbolsInRow-this.shift+this.chapterShift,n*this.symbolsInRow+this.symbolsInRow-this.shift+this.chapterShift)
		let wordsArray = rowText.split(' ').slice(0,-1);
          
		let lettersArray = wordsArray.join(' ').split('')

        this.shift += rowText.length-lettersArray.length
        if(lettersArray[0]==' '){lettersArray.shift()}
        if(lettersArray[lettersArray.length-1]!=' '){lettersArray.push(' ')}	




		let elemArray = []

		for(let i=0;i<lettersArray.length;i++){
           let elem = document.createElement('span')
           elem.className = 'untyped'
           elem.innerText = lettersArray[i]
           elemArray[i] = elem
		}

		return elemArray

	}
	initialize(){
        let randomChapter = getRandomChapter();
        this.chapterShift = getChapterShift(randomChapter)

        this.addNewRow()
        this.addNewRow()
        this.addNewRow()

        this.lettersBeforeShift = this.rowsOnScreen[0].innerText.length + this.rowsOnScreen[1].innerText.length+1

        document.addEventListener('keydown',e=>{

        	if(!this.started){this.started = true;startTimer()}
        	this.type()
        })

        this.textBlockElem.addEventListener('transitionend',()=>{this.textBlockElem.classList.remove('move');
			this.deleteOldRow()
		})
	}

     reset(){
        let randomChapter = getRandomChapter();
        this.chapterShift = getChapterShift(randomChapter)

        this.ended=false;
        this.started=false;
        this.textBlockElem.innerText = '';
        this.typed=0;
	   this.currentRow=0;
	   this.rowsOnScreen=[];
	   this.lettersOnScreen=[];
	   this.shift=0;
	   this.lettersBeforeShift=0;
	   this.timings=[];

	   this.addNewRow()
        this.addNewRow()
        this.addNewRow()

        this.lettersBeforeShift = this.rowsOnScreen[0].innerText.length + this.rowsOnScreen[1].innerText.length+1

        document.getElementById('restartButton').classList.add('hidden')
        document.getElementById('stats').classList.add('hidden')
        document.getElementById('textBlock').classList.remove('blur')

        document.getElementById('wps').innerText = ''
        document.getElementById('accuracy').innerText = ''
     }    

}
let textController = new TextController
textController.initialize()

function startTimer(){
	let duration = 30
	console.log('startedTimer')
	function result(){
	    textController.ended = true
	    document.getElementById('textBlock').classList.add('blur')
	    document.getElementById('stats').classList.remove('hidden')
         document.getElementById('wpm').innerText = Math.round(textController.typed * (60/duration) / 5)
         document.getElementById('accuracy').innerText = '100%'
	}
	setTimeout(result,duration*1000)

} 

function getRandomChapter(){
	let random = Math.round(Math.random()*27)+1
	return random
}

function getChapterShift(n){
	let digitBias = n>=10 ? 5 : 4
	return textController.text.indexOf(`${n}CH`)+digitBias
}
