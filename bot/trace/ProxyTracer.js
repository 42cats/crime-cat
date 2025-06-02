const tracer = require('./AsyncTraceLogger');

/**
 * 프록시 기반 자동 추적 시스템
 * 모든 메서드 호출을 자동으로 추적
 */
class ProxyTracer {
    constructor() {
        this.wrappedModules = new Map();
        this.excludePatterns = [
            /^_/,           // private 메서드
            /^constructor$/,
            /^toString$/,
            /^valueOf$/,
            /^toJSON$/,
            /^inspect$/
        ];
        
        // 제외할 모듈 이름
        this.excludeModules = new Set([
            'AsyncTraceLogger',
            'ProxyTracer',
            'logger'  // 기존 로거는 제외
        ]);
    }
    
    /**
     * 객체나 클래스를 프록시로 래핑
     */
    wrap(target, name) {
        // 이미 래핑된 경우 그대로 반환
        if (this.wrappedModules.has(target)) {
            return this.wrappedModules.get(target);
        }
        
        // 제외 대상 확인
        if (this.excludeModules.has(name)) {
            return target;
        }
        
        // 함수인 경우 (클래스 또는 함수)
        if (typeof target === 'function') {
            const wrapped = this.wrapFunction(target, name);
            this.wrappedModules.set(target, wrapped);
            return wrapped;
        }
        
        // 객체인 경우
        if (typeof target === 'object' && target !== null) {
            const wrapped = this.wrapObject(target, name);
            this.wrappedModules.set(target, wrapped);
            return wrapped;
        }
        
        return target;
    }
    
    /**
     * 함수/클래스 래핑
     */
    wrapFunction(fn, name) {
        const self = this;
        
        // 클래스인지 확인
        const isClass = fn.prototype && fn.prototype.constructor === fn;
        
        if (isClass) {
            // 클래스 프록시
            return new Proxy(fn, {
                construct(Target, args) {
                    const instance = new Target(...args);
                    return self.wrapObject(instance, name);
                },
                
                get(target, prop) {
                    // 정적 메서드 래핑
                    if (typeof target[prop] === 'function' && !self.shouldExclude(prop)) {
                        return self.wrapMethod(target[prop], `${name}.${prop}`, true);
                    }
                    return target[prop];
                }
            });
        } else {
            // 일반 함수 래핑
            return this.wrapMethod(fn, name, false);
        }
    }
    
    /**
     * 객체 래핑
     */
    wrapObject(obj, name) {
        return new Proxy(obj, {
            get: (target, prop) => {
                // 심볼이나 특수 속성은 그대로 반환
                if (typeof prop === 'symbol' || prop === 'then') {
                    return target[prop];
                }
                
                const value = target[prop];
                
                // 메서드인 경우 래핑
                if (typeof value === 'function' && !this.shouldExclude(prop)) {
                    return this.wrapMethod(value.bind(target), `${name}.${prop}`, false);
                }
                
                // 중첩 객체인 경우 재귀적으로 래핑
                if (typeof value === 'object' && value !== null && !this.isBuiltIn(value)) {
                    return this.wrap(value, `${name}.${prop}`);
                }
                
                return value;
            },
            
            set: (target, prop, value) => {
                target[prop] = value;
                return true;
            }
        });
    }
    
    /**
     * 메서드 래핑
     */
    wrapMethod(method, methodName, isStatic) {
        return new Proxy(method, {
            apply: async (target, thisArg, args) => {
                const context = tracer.getCurrentContext();
                
                // 추적 컨텍스트가 없으면 그냥 실행
                if (!context) {
                    return await target.apply(thisArg, args);
                }
                
                tracer.enterMethod(methodName);
                
                try {
                    const result = await target.apply(thisArg, args);
                    tracer.exitMethod(methodName);
                    return result;
                } catch (error) {
                    tracer.exitMethod(methodName, error);
                    throw error;
                }
            }
        });
    }
    
    /**
     * 제외 대상 확인
     */
    shouldExclude(propName) {
        return this.excludePatterns.some(pattern => pattern.test(propName));
    }
    
    /**
     * 내장 객체 확인
     */
    isBuiltIn(obj) {
        return obj instanceof Date ||
               obj instanceof RegExp ||
               obj instanceof Error ||
               obj instanceof Promise ||
               Array.isArray(obj) ||
               Buffer.isBuffer(obj);
    }
    
    /**
     * require 함수 래핑
     */
    wrapRequire() {
        const Module = require('module');
        const originalRequire = Module.prototype.require;
        const self = this;
        
        Module.prototype.require = function(id) {
            const module = originalRequire.apply(this, arguments);
            
            // 상대 경로인 경우만 래핑 (node_modules 제외)
            if (id.startsWith('./') || id.startsWith('../')) {
                const moduleName = id.split('/').pop().replace('.js', '');
                return self.wrap(module, moduleName);
            }
            
            return module;
        };
    }
    
    /**
     * 특정 모듈들을 수동으로 래핑
     */
    wrapModules(modules) {
        const wrapped = {};
        
        for (const [name, module] of Object.entries(modules)) {
            wrapped[name] = this.wrap(module, name);
        }
        
        return wrapped;
    }
}

// 싱글톤 인스턴스
const proxyTracer = new ProxyTracer();

module.exports = proxyTracer;