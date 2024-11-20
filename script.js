const canvas = document.getElementById('myCanvas')
const c = canvas.getContext('2d')
const frets = []


// Constants
const notes = ['a','a#','b','c','c#','d','d#','e','f','f#','g','g#']
let whatIntervalIsPositionedWhenClicking = 'root'

// Parametres
const nutPositionHorizontal = 20
const fretDistance = 50
const fretThickness = 1
const nutThickness = 3
const markLineThickness = 1
const markRadius = 10
const noteFont =  "11px verdana";
const noteTextDistance = {
    x: 3,
    y: 3
}
const intervalOverlayOffset = {
    x: 5, 
    y: 3
}
// colours
const noteColour = 'rgba(120,120,120,0.7)'
const fretColour = 'rgba(200,200,200,0.8)'
const markColour = 'rgba(12,12,12,0.4)'
const ghostColour = 'rgba(12,12,12,0.1)'
const invtervalColours = {
    root: 'rgba(250,0,0,0.5)',
    third: 'rgba(250,125,0,0.3)', 
    fourth: 'rgba(250,250,0,0.3)',
    fifth: 'rgba(250,0,125,0.3)',
    seventh: 'rgba(250,0,250,0.3)'
}
const windowColour = 'rgba(50,150,175,0.7)'
//#region Buttons and listeners
const buttonNotes = document.getElementById('buttonNotes')
const buttonIntervals = document.getElementById('buttonIntervals')
const buttonWindow = document.getElementById('buttonWindow')

// buttons and listeners
//// hover canvas
canvas.addEventListener('mousemove', (e)=>{
    guitar.clearHover()
    const mouseOverPosition = guitar.detectPosition({x: e.offsetX, y: e.offsetY})
    if (mouseOverPosition){
        mouseOverPosition.ghost = true
        guitar.refreshScreen()
    } 
    
})

canvas.addEventListener('mouseout', (e)=>{
    guitar.clearHover()
    guitar.refreshScreen()
})

//// Click canvas
canvas.addEventListener('click', (e) => {
    const clicked = guitar.detectPosition({x: e.offsetX, y: e.offsetY})
    const string = clicked.string
    const number = clicked.number
    const stringPitch = string.pitch
    const indexOfNoteClicked = (notes.indexOf(stringPitch) + number) % 12
    const noteClicked = notes[indexOfNoteClicked]
    const intervalPositioned = guitar.scale[whatIntervalIsPositionedWhenClicking]
    /// avoid negatives in modulo
    const dividend = indexOfNoteClicked - intervalPositioned.steps
    const divisor = 12
    const adjustedIndex = ((dividend % divisor) + divisor) % divisor

    const rootAfterAdjustment = notes[adjustedIndex]
    guitar.setRootAt(rootAfterAdjustment)
    guitar.setWindow(clicked)
    guitar.refreshScreen()
})  


//// show notes
buttonNotes.addEventListener('click', ()=> {
    guitar.show.notes = !guitar.show.notes
    if (guitar.show.notes) {buttonNotes.classList.add('button_on')}
    else {buttonNotes.classList.remove('button_on')}
    guitar.refreshScreen()
})

/// Intervals
buttonIntervals.addEventListener('click', ()=>{
    guitar.show.intervals = !guitar.show.intervals
    if (guitar.show.intervals){
        buttonIntervals.classList.add('button_on')
    } else {
        buttonIntervals.classList.remove('button_on')
    }

    // Individual interval buttons
    if (guitar.show.intervals) {
        turn_visibility('on',['root','third','fourth','fifth','seventh'])
    } else {
        turn_visibility('off',['root','third','fourth','fifth','seventh'])
    }
    guitar.refreshScreen()
})

function turn_visibility(direction, ints){
    for (const int of ints){
        const buttonName = "button_" + int + "s"
        const button = document.getElementById(buttonName)
        if (direction === 'on' && (!button.style.backgroundColor) ||
            direction === 'off' && (button.style.backgroundColor)
        )  {
            button.click()}
    }
}

function listener_interval(int){
    const buttonName = "button_" + int + "s"
    const button = document.getElementById(buttonName)
    button.addEventListener('click', ()=>{
        guitar.scale[int].toggle()
        
        if (guitar.scale[int].isVisible) {
            button.style.backgroundColor = invtervalColours[int]
        } else {
            button.style.removeProperty('background-color')
        }
        guitar.refreshScreen()
    })
}
listener_interval('root')
listener_interval('third')
listener_interval('fourth')
listener_interval('fifth')
listener_interval('seventh')


// window
buttonWindow.addEventListener('click', () => {
    guitar.show.window = !guitar.show.window
    guitar.setWindow()
    if (guitar.show.window){
        buttonWindow.classList.add('button_on')
    } else {
        buttonWindow.classList.remove('button_on')
    }
    guitar.refreshScreen()
})


// Select what to position on click
const select = document.getElementById('selectWhatToPosition')
select.addEventListener('change', ()=>{
    //ckhere
    whatIntervalIsPositionedWhenClicking = select.options[select.selectedIndex].textContent
})
//#endregion


//#region Classes

class Guitar{
    constructor(){
        this.strings = []
        this.positions = []
        this.scale
        this.scaleNotes = []
        this.rootStartsAt = undefined
        this.distanceBetweenStrings = 0
        this.show ={
            notes: true,
            intervals: true,
            roots: true,
            window: false,
        }
        this.windowCentre = undefined
    }

    
    // the string position calculated on creation is not correct, 
    // because this.strings.length changes every time a new string is created
    // This formulate updates all string positions 
    placeStrings(){
        this.distanceBetweenStrings = canvas.height / (this.strings.length + 1)
        for (const string of this.strings){
            string.start.y = canvas.height - (this.distanceBetweenStrings * (this.strings.indexOf(string) + 1))
            string.end.y = string.start.y
        }
    } 
    
    detectPosition({x, y}){
        for (const position of this.positions){
            if (
                x >= position.start.x && 
                x <= position.end.x && 
                y >= position.start.y && 
                y <= position.end.y 
            ){
                return position
            }
        }
    }

    createScale(){
        this.scale = new Scale()
    }

    clearHover(){
        for (const position of this.positions){
            position.ghost = false
        }
    }

    refreshScreen(){
        c.clearRect(0, 0, canvas.width, canvas.height);

        // nut
        nut.draw()
        // strings
        this.draw() 
        // frets
        for (const fret of frets){
            fret.draw()
            
            // marks
            if ([3,5,7,9].includes(fret.number)){
                fret.mark(false)
            } else if (fret.number === 12){
                fret.mark(true)
            }
        }


        // notes
        if (this.show.notes){
            this.drawNotes()
        } 

        // roots
        for (const interval in this.scale){
            //ckhere
            // console.log(this.scale[interval])
        }

        // intervals
        this.drawIntervals()

        // ghost
        for (const position of this.positions){
            if (position.ghost){
                position.draw()
            }
        }

        // window
        if (this.windowCentre){
            this.drawWindow()
        }
    }

    draw(){
        for(const string of this.strings){
            c.lineWidth = string.thickness
            c.beginPath()
            c.moveTo(string.start.x, string.start.y)
            c.lineTo(string.end.x, string.end.y)
            c.stroke()

            // draw the string letter
            c.fillStyle = noteColour
            c.font = noteFont
            c.fillText(string.pitch, string.start.x - noteTextDistance.x, string.start.y - noteTextDistance.y);
            c.fillStyle = 'black'


        }
    }

    drawNotes(){
        for (const string of this.strings){
            string.drawNotes()
        }
    }

    drawIntervals(){
        for (const position of this.positions){
            if (position.interval && position.interval.isVisible){
                position.drawInterval()
            }
        }
    }
    
    toggleSingleInterval(int){
        console.log(guitar.scale[int].toggle())
    }

    setRootAt(note){
        this.rootStartsAt = note
        
        /// clear the invervals of all the positions
        for (const position of this.positions){
            position.interval = undefined
        }
        /// attach the interval to all the positions
        for (const interval of this.scaleNotes){
            const nextIntervalNote = notes[(notes.indexOf(this.rootStartsAt) + interval.steps) % 12] 
            for (const position of this.positions){
                if (position.note === nextIntervalNote){
                    position.interval = interval
                }
            }
        }
    }

    setWindow(clicked){
        if(this.show.window){
            this.windowCentre = clicked
        } else {
            this.windowCentre = undefined
        }
    }

    drawWindow(){
        const width = this.windowCentre.end.x - this.windowCentre.start.x
        const height = this.windowCentre.end.y - this.windowCentre.start.y
        const topLeft = {
            x: this.windowCentre.start.x - width * 3, 
            y: this.windowCentre.start.y - height
        }
        const topRight = {
            x: topLeft.x + 7 * width,
            y: topLeft.y
        }
        const bottomRight = {
            x: topRight.x,
            y: topLeft.y + 3 * height
        }
        const bottomLeft = {
            x: topLeft.x,
            y: bottomRight.y
        }

        c.fillStyle = windowColour
        c.fillRect(0,0,canvas.width, topLeft.y)
        c.fillRect(0,topLeft.y, topLeft.x, bottomLeft.y - topLeft.y)
        c.fillRect(topRight.x,topRight.y, canvas.width - topRight.x, bottomLeft.y - topLeft.y)
        c.fillRect(0,bottomLeft.y, canvas.width, canvas.height - bottomLeft.y)
        /// If you wnant an outline instead
        // c.lineWidth = 3
        // c.strokeStyle = windowColour
        // c.beginPath()
        // c.moveTo(topLeft.x, topLeft.y)
        // c.lineTo(topRight.x, topRight.y)
        // c.lineTo(bottomRight.x, bottomRight.y)
        // c.lineTo(bottomLeft.x, bottomLeft.y)
        // c.closePath()
        // c.stroke()
        // c.strokeStyle = 'black'
        }    



}

class String{
    constructor({pitch, thickness = 2}){
        guitar.strings.push(this)
        this.pitch = pitch
        this.thickness = thickness
        this.start = {
            x: 10, 
            y: undefined,

        }
        this.end = {
            x: canvas.width, 
            y: undefined
        }
        this.positions = []
    }

    drawNotes(){
        for (const position of this.positions){
            c.fillStyle = noteColour
            c.font = noteFont
            c.fillText(position.note, position.start.x + fretDistance/2 - noteTextDistance.x, this.start.y  - noteTextDistance.y);
            c.fillStyle = 'black'        }
    }

}

class Fret{
    constructor(number){
        this.record()
        this.number = number
        this.start = {
            x: nutPositionHorizontal + fretDistance * this.number,
            y: 10, 
        }
        this.end = {
            x: this.start.x, 
            y: canvas.height-10
        }


        this.createStringPositions()
    }

    record(){
        frets.push(this)
    }

    draw(){
        c.lineWidth = fretThickness
        c.strokeStyle = fretColour
        c.beginPath()
        c.moveTo(this.start.x, this.start.y)
        c.lineTo(this.end.x, this.end.y)
        c.stroke()
        c.strokeStyle = 'black'
    }

    mark(double){
        c.lineWidth = markLineThickness
        c.strokeStyle = markColour
        c.beginPath();
        if (!double){
            c.arc(this.start.x - fretDistance/2, canvas.height/2, markRadius, 0, 2 * Math.PI);
            c.stroke();
        } else { // double circle
            c.arc(this.start.x - fretDistance/2, canvas.height/2 - markRadius , markRadius, 0, 2 * Math.PI);
            c.stroke();
            //second circle
            c.beginPath();
            c.arc(this.start.x - fretDistance/2, canvas.height/2 + markRadius , markRadius, 0, 2 * Math.PI);
            c.stroke();
        }
        c.strokeStyle = 'black'

    }

    createStringPositions(){
        for (const string of guitar.strings){
            const position = new Position({
                string: string,
                start: {
                    x: this.start.x - fretDistance,
                    y: string.start.y - guitar.distanceBetweenStrings/2
                }, 
                end: {
                    x: this.start.x, 
                    y: string.end.y + guitar.distanceBetweenStrings/2
                }, 
                note: notes[(notes.indexOf(string.pitch) + this.number) % 12], 
                number: this.number,
            })
 
        }
    }
}

class Nut extends Fret{
    constructor(){
        super(0)
    }

    draw(){
        c.lineWidth = nutThickness
        c.beginPath()
        c.moveTo(this.start.x, this.start.y)
        c.lineTo(this.end.x, this.end.y)
        c.stroke()
    }


}

class Position{
    constructor({string, start, end, note, number}){
        this.string = string
        this.string.positions.push(this)
        guitar.positions.push(this)
        this.ghost = false
        this.start = start
        this.end = end, 
        this.note = note, 
        this.number = number
        this.interval = undefined
    }

    draw() {
        c.fillStyle = ghostColour
        c.fillRect(this.start.x, this.start.y, this.end.x - this.start.x, this.end.y -  this.start.y)
    } 

    drawSolid(){
        c.lineWidth = 1
        c.strokeStyle = 'blue'
        c.beginPath()
        c.moveTo(this.start.x, this.start.y)
        c.lineTo(this.end.x, this.start.y)
        c.lineTo(this.end.x, this.end.y)
        c.lineTo(this.start.x, this.end.y)
        c.closePath()
        c.stroke()
        c.strokeStyle = 'black'
    }

    drawInterval(){
        
        c.fillStyle = this.interval.colour
        c.fillRect(
            this.start.x + intervalOverlayOffset.x , 
            this.start.y + intervalOverlayOffset.y, 
            this.end.x - this.start.x - (2 * intervalOverlayOffset.x), 
            this.end.y -  this.start.y - (2 * intervalOverlayOffset.y))
        }

}

class Scale{
    constructor(){
        this.root = new PentatoncInterval({steps:0, name:'root'})
        this.third = new PentatoncInterval({steps:3, name:'third'})
        this.fourth = new PentatoncInterval({steps:5, name:'fourth'})
        this.fifth = new PentatoncInterval({steps:7, name:'fifth'})
        this.seventh = new PentatoncInterval({steps:10, name:'seventh'})
    }
}


class PentatoncInterval{
    constructor({name, steps, colour}){
        guitar.scaleNotes.push(this)
        this.name = name
        this.steps = steps
        this.note = undefined
        this.colour = invtervalColours[this.name]
        this.isVisible = true
        this.initialColour()
    }

    initialColour(){
        const buttonName = "button_" + this.name + "s"
        const button = document.getElementById(buttonName)
        button.style.backgroundColor = this.colour
    }

    toggle(){
        this.isVisible = !this.isVisible
    }
    
    distanceFrom(otherInveral){
        const distance = otherInveral.steps - this.steps
        return distance
    }
}


//#endregion Classes

// create strings
const guitar = new Guitar()
// Full set of strings with 5 semitones all
// for (let i = 0; i < 15; i++){
//     const num = (i * 5) % 12
//     new String({pitch: notes[num]})
// }
const string_fsharp = new String({pitch: 'f#'})
const string_blow = new String({pitch: 'b'})
const string_e = new String({pitch: 'e'})
const string_a = new String({pitch: 'a'})
const string_d = new String({pitch: 'd'})
const string_g = new String({pitch: 'g'})
const string_b = new String({pitch: 'b'})
const string_ehigh = new String({pitch: 'e'})
guitar.placeStrings()

// create nut and frets
const nut = new Nut()
for (let i = 1; i < 13; i++){
    const fret = new Fret(i)
}

// create the scale
guitar.createScale()

guitar.refreshScreen()
