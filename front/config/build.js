import { spawn } from 'child_process'

let printPending = false
const pendingOut  = []

function upd() {
    if(!printPending) return
    for(let j = 0; j < pendingOut.length; j++) {
        const it = pendingOut[j]
        if(it[0] == 0) process.stdout.write(it[1]);
        else process.stderr.write(it[1]);
    }
    pendingOut.length = 0
}

function codeMsg(code) {
    if(code == 0) {
        return '\x1b[1;42mExited with ' + code + '\x1b[0m\n'
    }
    else {
        return '\x1b[1;41mExited with ' + code + '\x1b[0m\n'
    }
}


// https://stackoverflow.com/a/54515183
const proc = spawn('tsc -b', [], { shell: true, stdio: ['ignore', 'inherit', 'inherit'] });
proc.on('error', (err) => {
    console.log(err)
    printPending = true
    upd()
})
proc.on('exit', (code) => {
    console.log(codeMsg(code))
    printPending = true
    upd()
})

const proc2 = spawn('vite build', [], { shell: true });
proc2.stdout.on('data', (data) => {
    pendingOut.push([0, data])
    upd()
})

proc2.stderr.on('data', (data) => {
    pendingOut.push([1, data])
    upd()
})

proc2.on('close', (code) => {
    pendingOut.push([0, codeMsg(code)])
    upd()
})
