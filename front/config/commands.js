import { spawn } from 'child_process'

const args = process.argv.slice(2)

const viteConf = './config/vite.config.ts'
const eslintConf = './config/eslint.config.js'

if(args[0] === 'dev') {
    const proc = spawn('vite', ['-c', viteConf], { shell: true, stdio: 'inherit' })
    proc.on('close', (code) => process.exit(code))
}
else if(args[0] === 'lint') {
    const proc = spawn('eslint', ['-c', eslintConf, '.'], { shell: true, stdio: 'inherit' })
    proc.on('close', (code) => process.exit(code))
}
else if(args[0] === 'preview') {
    const proc = spawn('vite', ['-c', viteConf, 'preview'], { shell: true, stdio: 'inherit' })
    proc.on('close', (code) => process.exit(code))
}
else if(args[0] === 'typecheck') {
    const proc = spawn('tsc', ['-b'], { shell: true, stdio: 'inherit' })
    proc.on('close', (code) => process.exit(code))
}
else if(args[0] === 'build') {
    // note: tsc reqires that stdout pipe isTTY == true in order to output colored and full output.
    // There is no flag to change this behavior, so we make its process inherit out pipes.
    const typecheckCom = ['tsc', ['-b']]
    const viteCom = ['vite', ['build', '-c', viteConf, '--emptyOutDir']]

    let exited = [false, false]
    let exitCode = 0
    let printPending = false
    const pendingOut  = []

    function upd() {
        if(printPending) {
            for(let j = 0; j < pendingOut.length; j++) {
                const it = pendingOut[j]
                if(it[0] == 0) process.stdout.write(it[1]);
                else process.stderr.write(it[1]);
            }
            pendingOut.length = 0
        }
        if(exited[0] && exited[1]) {
            process.exit(exitCode)
        }
    }

    function codeMsg(code) {
        if(code == 0) return '\x1b[1;42mExited with ' + code + '\x1b[0m\n'
        else return '\x1b[1;41mExited with ' + code + '\x1b[0m\n'
    }


    // https://stackoverflow.com/a/54515183
    const tsProc = spawn(typecheckCom[0], typecheckCom[1], { shell: true, stdio: ['ignore', 'inherit', 'inherit'] });
    tsProc.on('error', (err) => {
        console.log(err)
        printPending = true
        exited[0] = true
        exitCode = 1
        upd()
    })
    tsProc.on('exit', (code) => {
        console.log(codeMsg(code))
        printPending = true
        exited[0] = true
        if(code != 0) exitCode = code
        upd()
    })

    const viteProc = spawn(viteCom[0], viteCom[1], { shell: true });
    viteProc.on('error', (err) => {
        pendingOut.push([1, err])
        exited[1] = true
        exitCode = 1
        upd()
    })
    viteProc.stdout.on('data', (data) => {
        pendingOut.push([0, data])
        upd()
    })

    viteProc.stderr.on('data', (data) => {
        pendingOut.push([1, data])
        upd()
    })
    viteProc.on('close', (code) => {
        pendingOut.push([0, codeMsg(code)])
        exited[1] = true
        if(code != 0) exitCode = code
        upd()
    })
}

