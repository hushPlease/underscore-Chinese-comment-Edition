//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

    // Baseline setup
    // 代码开始
    // --------------

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    // 于浏览器端创建`window`根对象，或于服务器端创建`global`根对象，引擎当中创建`this`对象。当浏览器支持`WebWorker`时，我们使用`self`对象而不是`window`对象。
    var root = typeof self == 'object' && self.self === self && self ||
        typeof global == 'object' && global.global === global && global ||
        this;

    // Save the previous value of the `_` variable.
    // 将`_`的先前值赋给previousUnderscore变量
    var previousUnderscore = root._;

    // Save bytes in the minified (but not gzipped) version:
    // 将数据存储于简化版本中（而非压缩版）
    var ArrayProto = Array.prototype, ObjProto = Object.prototype;
    var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

    // Create quick reference variables for speed access to core prototypes.
    // 快速创建一个变量引用，该引用加速了核心原型的访问
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    // 我们想要使用的全部 **ECMAScript 5** 原生函数实现方法声明如下
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeCreate = Object.create;

    // Naked function reference for surrogate-prototype-swapping.
    // 用于创建实例副本的裸函数引用
    // 参见 [相关讨论](http://stackoverflow.com/questions/30496650/what-is-surrogate-prototype-swapping-in-javascript)
    var Ctor = function(){};

    // Create a safe reference to the Underscore object for use below.
    // 为下面使用的Underscore对象创建安全引用
    var _ = function(obj) {
        if (obj instanceof _) return obj;
        if (!(this instanceof _)) return new _(obj);
        this._wrapped = obj;
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for their old module API. If we're in
    // the browser, add `_` as a global object.
    // (`nodeType` is checked to ensure that `module`
    // and `exports` are not HTML elements.)
    // 出于对老版本 **Node.js** 中 module API的向后兼容，导出Underscore对象。若于浏览器中使用，则添加`_`为全局对象————`NodeType`用来确定`module`和`exports`不是HTML元素
    if (typeof exports != 'undefined' && !exports.nodeType) {
        if (typeof module != 'undefined' && !module.nodeType && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }

    // Current version.
    // 当前版本1.8.3
    _.VERSION = '1.8.3';

    // Internal function that returns an efficient (for current engines) version
    // of the passed-in callback, to be repeatedly applied in other Underscore
    // functions.
    // 通过参数传入回调，返回一个有效的内部函数，以便于在其他的Underscore函数中应用
    var optimizeCb = function(func, context, argCount) {
        if (context === void 0) return func;
        switch (argCount == null ? 3 : argCount) {
            case 1: return function(value) {
                return func.call(context, value);
            };
            // The 2-parameter case has been omitted only because no current consumers
            // made use of it.
            // 目前没有开发者使用双参数函数，因此省略不谈
            case 3: return function(value, index, collection) {
                return func.call(context, value, index, collection);
            };
            case 4: return function(accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection);
            };
        }
        return function() {
            return func.apply(context, arguments);
        };
    };

    var builtinIteratee;

    // An internal function to generate callbacks that can be applied to each
    // element in a collection, returning the desired result — either `identity`,
    // an arbitrary callback, a property matcher, or a property accessor.
    // 一个主要用于生产可以适配集合中任意元素的内部回调函数，并可返回多种期望结果————或是标识，或是任意某个回调，或是一个属性适配器，亦或是一个属性访问器
    var cb = function(value, context, argCount) {
        if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
        if (value == null) return _.identity;
        if (_.isFunction(value)) return optimizeCb(value, context, argCount);
        if (_.isObject(value)) return _.matcher(value);
        return _.property(value);
    };

    // External wrapper for our callback generator. Users may customize
    // `_.iteratee` if they want additional predicate/iteratee shorthand styles.
    // This abstraction hides the internal-only argCount argument.
    // 回调产生器的外部封装，用户可以自定义`_iteratee`的助记风格。这种抽象隐藏了内部专有的argCount参数
    _.iteratee = builtinIteratee = function(value, context) {
        return cb(value, context, Infinity);
    };

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // 和ES6中的rest特性相似，根据给定参数的索引位置，将参数填充到索引之后的位置上（参见 Issue#2542）
    var restArgs = function(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
                case 2: return func.call(this, arguments[0], arguments[1], rest);
            }
            var args = Array(startIndex + 1);
            for (index = 0; index < startIndex; index++) {
                args[index] = arguments[index];
            }
            args[startIndex] = rest;
            return func.apply(this, args);
        };
    };

    // An internal function for creating a new object that inherits from another.
    // 用于创建一个继承于其他对象的新对象的内部函数
    var baseCreate = function(prototype) {
        if (!_.isObject(prototype)) return {};
        if (nativeCreate) return nativeCreate(prototype);
        Ctor.prototype = prototype;
        var result = new Ctor;
        Ctor.prototype = null;
        return result;
    };

    var property = function(key) {
        return function(obj) {
            return obj == null ? void 0 : obj[key];
        };
    };

    // Helper for collection methods to determine whether a collection
    // should be iterated as an array or as an object.
    // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
    // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
    // 集合的辅助方法，用来确定集合的遍历目标是作为数组还是作为对象
    // 避免了一个跑在arm-64上的iOS8上非常讨厌的bug。参考#2094
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    var getLength = property('length');
    var isArrayLike = function(collection) {
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };

    // Collection Functions
    // 集合的相关函数
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles raw objects in addition to array-likes. Treats all
    // sparse array-likes as if they were dense.
    // 基本的`each`方法实现，又名`forEach`
    // 处理除类数组对象以外的所有原始对象，将所有密集可迭代对象视为稀疏元素的类数组对象
    _.each = _.forEach = function(obj, iteratee, context) {
        iteratee = optimizeCb(iteratee, context);
        var i, length;
        if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else {
            var keys = _.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    };

    // Return the results of applying the iteratee to each element.
    // 返回将iteratee应用到各元素的结果
    _.map = _.collect = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length,
            results = Array(length);
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    // Create a reducing function iterating left or right.
    // 创建一个前序或后序迭代的推演函数
    var createReduce = function(dir) {
        // Wrap code that reassigns argument variables in a separate function than
        // the one that accesses `arguments.length` to avoid a perf hit. (#1991)
        // 通过对单一函数的内部参数的再分配来提高函数性能，而避免直接访问参数长度（参考Pull #1991）
        var reducer = function(obj, iteratee, memo, initial) {
            var keys = !isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                index = dir > 0 ? 0 : length - 1;
            if (!initial) {
                memo = obj[keys ? keys[index] : index];
                index += dir;
            }
            for (; index >= 0 && index < length; index += dir) {
                var currentKey = keys ? keys[index] : index;
                memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }
            return memo;
        };

        return function(obj, iteratee, memo, context) {
            var initial = arguments.length >= 3;
            return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
        };
    };

    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`.
    // **Reduce**方法将一系列（同一组）的值积聚到单一结果中，此方法亦叫做`inject`或者`foldl`(The left-associative and default version of reduce，Reduce方法的前序版本，即默认版本)"
    _.reduce = _.foldl = _.inject = createReduce(1);

    // The right-associative version of reduce, also known as `foldr`.
    // Reduce方法的后序版本，亦叫做`foldr`
    _.reduceRight = _.foldr = createReduce(-1);

    // Return the first value which passes a truth test. Aliased as `detect`.
    // 返回第一个值的的绝对（指类型和内容都相同）检测结果，亦叫做`detect`方法
    _.find = _.detect = function(obj, predicate, context) {
        var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
        var key = keyFinder(obj, predicate, context);
        if (key !== void 0 && key !== -1) return obj[key];
    };

    // Return all the elements that pass a truth test.
    // Aliased as `select`.
    // 返回所有通过绝对检测的元素值，亦叫做`select`方法
    _.filter = _.select = function(obj, predicate, context) {
        var results = [];
        predicate = cb(predicate, context);
        _.each(obj, function(value, index, list) {
            if (predicate(value, index, list)) results.push(value);
        });
        return results;
    };

    // Return all the elements for which a truth test fails.
    // 返回所有未通过绝对检测的元素值
    _.reject = function(obj, predicate, context) {
        return _.filter(obj, _.negate(cb(predicate)), context);
    };

    // Determine whether all of the elements match a truth test.
    // Aliased as `all`.
    // 确认所有元素是否都通过了绝对检测，亦叫做`all`方法
    _.every = _.all = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (!predicate(obj[currentKey], currentKey, obj)) return false;
        }
        return true;
    };

    // Determine if at least one element in the object matches a truth test.
    // Aliased as `any`.
    // 确认是否存在某一元素通过了绝对检测，亦叫做`any`方法
    _.some = _.any = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (predicate(obj[currentKey], currentKey, obj)) return true;
        }
        return false;
    };

    // Determine if the array or object contains a given item (using `===`).
    // Aliased as `includes` and `include`.
    // 确认数组或对象是否包含给定项（使用`===`判断），亦叫做`includes`方法或`include`方法
    _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
        if (!isArrayLike(obj)) obj = _.values(obj);
        if (typeof fromIndex != 'number' || guard) fromIndex = 0;
        return _.indexOf(obj, item, fromIndex) >= 0;
    };

    // Invoke a method (with arguments) on every item in a collection.
    // 为集合中的元素绑定方法调用（含参）
    _.invoke = restArgs(function(obj, method, args) {
        var isFunc = _.isFunction(method);
        return _.map(obj, function(value) {
            var func = isFunc ? method : value[method];
            return func == null ? func : func.apply(value, args);
        });
    });

    // Convenience version of a common use case of `map`: fetching a property.
    // 快捷的`map`对象的常见用例：获取属性值
    _.pluck = function(obj, key) {
        return _.map(obj, _.property(key));
    };

    // Convenience version of a common use case of `filter`: selecting only objects
    // containing specific `key:value` pairs.
    // 快捷的`filter`对象的常见用例：选择只包含特定键值对的对象
    // where可能返回多个对象
    _.where = function(obj, attrs) {
        return _.filter(obj, _.matcher(attrs));
    };

    // Convenience version of a common use case of `find`: getting the first object
    // containing specific `key:value` pairs.
    // 快捷的`find`对象的常见用例：获取首个包含特定键值对的对象
    // findWhere至多返回一个对象
    _.findWhere = function(obj, attrs) {
        return _.find(obj, _.matcher(attrs));
    };

    // Return the maximum element (or element-based computation).
    // 返回迭代器当中的最大元素（或者基于元素计算后的最大值）
    _.max = function(obj, iteratee, context) {
        var result = -Infinity, lastComputed = -Infinity,
            value, computed;
        if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value != null && value > result) {
                    result = value;
                }
            }
        } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function(v, index, list) {
                computed = iteratee(v, index, list);
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = v;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Return the minimum element (or element-based computation).
    // 返回迭代器当中的最小元素（或者基于元素计算后的最小值）
    _.min = function(obj, iteratee, context) {
        var result = Infinity, lastComputed = Infinity,
            value, computed;
        if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value != null && value < result) {
                    result = value;
                }
            }
        } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function(v, index, list) {
                computed = iteratee(v, index, list);
                if (computed < lastComputed || computed === Infinity && result === Infinity) {
                    result = v;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };

    // Shuffle a collection.
    // 打乱集合当中的元素
    _.shuffle = function(obj) {
        return _.sample(obj, Infinity);
    };

    // Sample **n** random values from a collection using the modern version of the
    // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
    // If **n** is not specified, returns a single random element.
    // The internal `guard` argument allows it to work with `map`.
    // 随机样本n的取值基于目前版本[Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle)算法。
    // 若n未定义，则返回一个随机元素值。内部的`guard`参数使得该方法可以配合`map`对象使用
    _.sample = function(obj, n, guard) {
        if (n == null || guard) {
            if (!isArrayLike(obj)) obj = _.values(obj);
            return obj[_.random(obj.length - 1)];
        }
        var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
        var length = getLength(sample);
        n = Math.max(Math.min(n, length), 0);
        var last = length - 1;
        for (var index = 0; index < n; index++) {
            var rand = _.random(index, last);
            var temp = sample[index];
            sample[index] = sample[rand];
            sample[rand] = temp;
        }
        return sample.slice(0, n);
    };

    // Sort the object's values by a criterion produced by an iteratee.
    // 按照iteratee中的规则排序对象中的值
    _.sortBy = function(obj, iteratee, context) {
        var index = 0;
        iteratee = cb(iteratee, context);
        return _.pluck(_.map(obj, function(value, key, list) {
            return {
                value: value,
                index: index++,
                criteria: iteratee(value, key, list)
            };
        }).sort(function(left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }
            return left.index - right.index;
        }), 'value');
    };

    // An internal function used for aggregate "group by" operations.
    // 用于整体的"group by"操作的内部函数
    var group = function(behavior, partition) {
        return function(obj, iteratee, context) {
            var result = partition ? [[], []] : {};
            iteratee = cb(iteratee, context);
            _.each(obj, function(value, index) {
                var key = iteratee(value, index, obj);
                behavior(result, value, key);
            });
            return result;
        };
    };

    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    // 根据给定规范，将对象值分组。传入的参数可以是一个字符串，也可以是一个能够返回分组规则的函数
    _.groupBy = group(function(result, value, key) {
        if (_.has(result, key)) result[key].push(value); else result[key] = [value];
    });

    // Indexes the object's values by a criterion, similar to `groupBy`, but for
    // when you know that your index values will be unique.
    // 根据给定规范，为对象值建立索引，就像`groupBy`方法一样，但是不同的是我们可以确定这里为对象创建的索引是独一无二的
    _.indexBy = group(function(result, value, key) {
        result[key] = value;
    });

    // Counts instances of an object that group by a certain criterion. Pass
    // either a string attribute to count by, or a function that returns the
    // criterion.
    // 根据给定规范，计算对象实例的个数总和，传入的参数可以是一个字符串，也可以是一个能够返回分组规则的函数
    _.countBy = group(function(result, value, key) {
        if (_.has(result, key)) result[key]++; else result[key] = 1;
    });

    var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
    // Safely create a real, live array from anything iterable.
    // 将任意可迭代的对象安全的转换为实用的数组 （参见 https://www.zhihu.com/question/38324041）
    _.toArray = function(obj) {
        if (!obj) return [];
        if (_.isArray(obj)) return slice.call(obj);
        if (_.isString(obj)) {
            // Keep surrogate pair characters together
            // surrogate pair：在utf-8编码中存在一个字符对应多个utf-8编码的情况，而这种多个编码的情形称为字符的代理对，即surrogate pair。
            // 这里主要指：返回字符串对象的副本，保留字符串本身的编码特性
            return obj.match(reStrSymbol);
        }
        if (isArrayLike(obj)) return _.map(obj, _.identity);
        return _.values(obj);
    };

    // Return the number of elements in an object.
    // 返回对象中的元素个数
    _.size = function(obj) {
        if (obj == null) return 0;
        return isArrayLike(obj) ? obj.length : _.keys(obj).length;
    };

    // Split a collection into two arrays: one whose elements all satisfy the given
    // predicate, and one whose elements all do not satisfy the predicate.
    // 将集合分为两个数组：一个数组中的所有元素都满足给定断言，另一组则不满足
    _.partition = group(function(result, value, pass) {
        result[pass ? 0 : 1].push(value);
    }, true);

    // Array Functions
    // 数组函数
    // ---------------

    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.
    // 获取数组中的第一个元素，传入**n**时返回第N个元素，亦叫做`head`方法或`take`方法。内部的**guard**参数使得该方法可以配合`_.map`对象使用
    _.first = _.head = _.take = function(array, n, guard) {
        if (array == null || array.length < 1) return void 0;
        if (n == null || guard) return array[0];
        return _.initial(array, array.length - n);
    };

    // Returns everything but the last entry of the array. Especially useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N.
    // 返回除去数组最后一条目的所有值，对参数对象尤为重要。将**n**传入数组会返回除倒数第N个元素以外的值。
    _.initial = function(array, n, guard) {
        return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };

    // Get the last element of an array. Passing **n** will return the last N
    // values in the array.
    // 获取数组的最后一个元素。将**n**传入数组会返回倒数第N个元素的值。
    _.last = function(array, n, guard) {
        if (array == null || array.length < 1) return void 0;
        if (n == null || guard) return array[array.length - 1];
        return _.rest(array, Math.max(0, array.length - n));
    };

    // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
    // Especially useful on the arguments object. Passing an **n** will return
    // the rest N values in the array.
    // 返回除去数组首个条目的所有值，亦叫做`tail`方法或`drop`方法，对参数对象尤为重要。将**n**传入数组会返回剩下的N个值。
    _.rest = _.tail = _.drop = function(array, n, guard) {
        return slice.call(array, n == null || guard ? 1 : n);
    };

    // Trim out all falsy values from an array.
    // 剔除掉数组中所有错误的值
    _.compact = function(array) {
        return _.filter(array, Boolean);
    };

    // Internal implementation of a recursive `flatten` function.
    // 递归函数`flatten`的内部实现
    var flatten = function(input, shallow, strict, output) {
        output = output || [];
        var idx = output.length;
        for (var i = 0, length = getLength(input); i < length; i++) {
            var value = input[i];
            if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                // Flatten current level of array or arguments object.
                // 降低当前数组或参数对象的等级
                if (shallow) {
                    var j = 0, len = value.length;
                    while (j < len) output[idx++] = value[j++];
                } else {
                    flatten(value, shallow, strict, output);
                    idx = output.length;
                }
            } else if (!strict) {
                output[idx++] = value;
            }
        }
        return output;
    };

    // Flatten out an array, either recursively (by default), or just one level.
    // 降低多层嵌套数组的等级，或仅仅削减一层
    _.flatten = function(array, shallow) {
        return flatten(array, shallow, false);
    };

    // Return a version of the array that does not contain the specified value(s).
    // 返回不包含该特定值的数组版本
    _.without = restArgs(function(array, otherArrays) {
        return _.difference(array, otherArrays);
    });

    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    // 生产一个数组去重之后的副本。当前数组如果已经被排序（此时isSorted传入值为true），此函数将运行更高效的算法。亦叫做`unique`方法
    _.uniq = _.unique = function(array, isSorted, iteratee, context) {
        if (!_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }
        if (iteratee != null) iteratee = cb(iteratee, context);
        var result = [];
        var seen = [];
        for (var i = 0, length = getLength(array); i < length; i++) {
            var value = array[i],
                computed = iteratee ? iteratee(value, i, array) : value;
            if (isSorted) {
                if (!i || seen !== computed) result.push(value);
                seen = computed;
            } else if (iteratee) {
                if (!_.contains(seen, computed)) {
                    seen.push(computed);
                    result.push(value);
                }
            } else if (!_.contains(result, value)) {
                result.push(value);
            }
        }
        return result;
    };

    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    // 产生一个传入数组的并集，将传入的数组元素执行去重操作
    _.union = restArgs(function(arrays) {
        return _.uniq(flatten(arrays, true, true));
    });

    // Produce an array that contains every item shared between all the
    // passed-in arrays.
    // 产生一个传入数组的交集
    _.intersection = function(array) {
        var result = [];
        var argsLength = arguments.length;
        for (var i = 0, length = getLength(array); i < length; i++) {
            var item = array[i];
            if (_.contains(result, item)) continue;
            var j;
            for (j = 1; j < argsLength; j++) {
                if (!_.contains(arguments[j], item)) break;
            }
            if (j === argsLength) result.push(item);
        }
        return result;
    };

    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    // 返回第一个数组与其他数组交集的补集，并删去不存在于第一个数组的元素
    _.difference = restArgs(function(array, rest) {
        rest = flatten(rest, true, true);
        return _.filter(array, function(value){
            return !_.contains(rest, value);
        });
    });

    // Complement of _.zip. Unzip accepts an array of arrays and groups
    // each array's elements on shared indices.
    // "_.zip"方法的补充。接受多个数组，返回一串联的新数组，其第一元素包含所有输入数组的第一元素，第二元素包含了所有的第二元素，以此类推
    _.unzip = function(array) {
        var length = array && _.max(array, getLength).length || 0;
        var result = Array(length);

        for (var index = 0; index < length; index++) {
            result[index] = _.pluck(array, index);
        }
        return result;
    };

    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    // 接受多个array，将多个数组中相同索引的值组合成为新数组
    _.zip = restArgs(_.unzip);

    // Converts lists into objects. Pass either a single array of `[key, value]`
    // pairs, or two parallel arrays of the same length -- one of keys, and one of
    // the corresponding values.
    // 将列表（数组）转换为对象，传递任何一个单独的`[key,value]`对的列表，或者一个为属性，另外一个为属性的值
    _.object = function(list, values) {
        var result = {};
        for (var i = 0, length = getLength(list); i < length; i++) {
            if (values) {
                result[list[i]] = values[i];
            } else {
                result[list[i][0]] = list[i][1];
            }
        }
        return result;
    };

    // Generator function to create the findIndex and findLastIndex functions.
    // 用来创造"findIndex"与"findLastIndex"函数的产生器
    var createPredicateIndexFinder = function(dir) {
        return function(array, predicate, context) {
            predicate = cb(predicate, context);
            var length = getLength(array);
            var index = dir > 0 ? 0 : length - 1;
            for (; index >= 0 && index < length; index += dir) {
                if (predicate(array[index], index, array)) return index;
            }
            return -1;
        };
    };

    // Returns the first index on an array-like that passes a predicate test.
    // 返回类数组当中第一个通过断言测试的元素索引
    _.findIndex = createPredicateIndexFinder(1);
    _.findLastIndex = createPredicateIndexFinder(-1);

    // Use a comparator function to figure out the smallest index at which
    // an object should be inserted so as to maintain order. Uses binary search.
    // 使用二分查找，确定插入元素在数组中的索引，元素按此索引插入后仍保持数组原有的排序
    _.sortedIndex = function(array, obj, iteratee, context) {
        iteratee = cb(iteratee, context, 1);
        var value = iteratee(obj);
        var low = 0, high = getLength(array);
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
        }
        return low;
    };

    // Generator function to create the indexOf and lastIndexOf functions.
    // 用来创造"indexOf"与"lastIndexOf"函数的产生器
    var createIndexFinder = function(dir, predicateFind, sortedIndex) {
        return function(array, item, idx) {
            var i = 0, length = getLength(array);
            if (typeof idx == 'number') {
                if (dir > 0) {
                    i = idx >= 0 ? idx : Math.max(idx + length, i);
                } else {
                    length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
                }
            } else if (sortedIndex && idx && length) {
                idx = sortedIndex(array, item);
                return array[idx] === item ? idx : -1;
            }
            if (item !== item) {
                idx = predicateFind(slice.call(array, i, length), _.isNaN);
                return idx >= 0 ? idx + i : -1;
            }
            for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
                if (array[idx] === item) return idx;
            }
            return -1;
        };
    };

    // Return the position of the first occurrence of an item in an array,
    // or -1 if the item is not included in the array.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    // 返回某项首次出现在某数组中的位置，若该数组中不存在此元素则返回"-1"
    // 使用二分查找时，若该数组已排序，则将**isSorted**值设为`true`
    _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
    _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    // 产生一个包含算术级数的整数数列，作为Python中`range()`方法的接口。相关文档参见：http://docs.python.org/library/functions.html#range
    _.range = function(start, stop, step) {
        if (stop == null) {
            stop = start || 0;
            start = 0;
        }
        if (!step) {
            step = stop < start ? -1 : 1;
        }

        var length = Math.max(Math.ceil((stop - start) / step), 0);
        var range = Array(length);

        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }

        return range;
    };

    // Split an **array** into several arrays containing **count** or less elements
    // of initial array.
    // 较之初始数组，将数组按指定**count**值进行拆分，若数组长度不能被**count**值整除，则余数元素自成为一个数组
    _.chunk = function(array, count) {
        if (count == null || count < 1) return [];

        var result = [];
        var i = 0, length = array.length;
        while (i < length) {
            result.push(slice.call(array, i, i += count));
        }
        return result;
    };

    // Function (ahem) Functions
    // 功能函数
    //
    // ------------------

    // Determines whether to execute a function as a constructor
    // or a normal function with the provided arguments.
    // 根据现有参数来判断将一个函数作为构造函数执行或作为普通函数执行
    var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
        if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
        var self = baseCreate(sourceFunc.prototype);
        var result = sourceFunc.apply(self, args);
        if (_.isObject(result)) return result;
        return self;
    };

    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
    // available.
    // 绑定函数到对应对象（可绑定到当前对象`this`，或任一指定参数）。条件允许时则授权给符合**ECMAScript 5**的原生`Function.bind`函数。
    _.bind = restArgs(function(func, context, args) {
        if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
        var bound = restArgs(function(callArgs) {
            return executeBound(func, bound, context, this, args.concat(callArgs));
        });
        return bound;
    });

    // Partially apply a function by creating a version that has had some of its
    // arguments pre-filled, without changing its dynamic `this` context. _ acts
    // as a placeholder by default, allowing any combination of arguments to be
    // pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.
    // 创建一个函数的局部应用版本，该版本可绑定任意个数的参数，且不该变函数内部动态的`this`值。
    // `_`作为默认的占位符时，允许预先填充任意参数的组合。此时，将会把`_.partial.placeholder`设定为自定义参数。
    _.partial = restArgs(function(func, boundArgs) {
        var placeholder = _.partial.placeholder;
        var bound = function() {
            var position = 0, length = boundArgs.length;
            var args = Array(length);
            for (var i = 0; i < length; i++) {
                args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
            }
            while (position < arguments.length) args.push(arguments[position++]);
            return executeBound(func, bound, this, this, args);
        };
        return bound;
    });

    _.partial.placeholder = _;

    // Bind a number of an object's methods to that object. Remaining arguments
    // are the method names to be bound. Useful for ensuring that all callbacks
    // defined on an object belong to it.
    // 将一系列该对象方法绑定于该对象，剩余参数为要被绑定的方法名。对定义于属于该对象的回调方法的确定很有帮助
    _.bindAll = restArgs(function(obj, keys) {
        keys = flatten(keys, false, false);
        var index = keys.length;
        if (index < 1) throw new Error('bindAll must be passed function names');
        while (index--) {
            var key = keys[index];
            obj[key] = _.bind(obj[key], obj);
        }
    });

    // Memoize an expensive function by storing its results.
    // "Memoize"方法用于储存高代价函数的结果。
    _.memoize = function(func, hasher) {
        var memoize = function(key) {
            var cache = memoize.cache;
            var address = '' + (hasher ? hasher.apply(this, arguments) : key);
            if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
            return cache[address];
        };
        memoize.cache = {};
        return memoize;
    };

    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    // 按给定时间阻塞函数，并使用提供的参数调用它
    _.delay = restArgs(function(func, wait, args) {
        return setTimeout(function() {
            return func.apply(null, args);
        }, wait);
    });

    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    // 当前调用栈阻塞时，延期执行此函数
    _.defer = _.partial(_.delay, _, 1);

    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time. Normally, the throttled function will run
    // as much as it can, without ever going more than once per `wait` duration;
    // but if you'd like to disable the execution on the leading edge, pass
    // `{leading: false}`. To disable execution on the trailing edge, ditto.
    // 默认情况下，throttle函数会在你调用的第一时间被执行，并且如果在等待期间内调用任意次数该函数，响应都会被尽快覆盖。
    // 如果你想禁用首次执行，传递'{leading:false}'，如果想禁用最后一次执行，传递'{trailing:false}'
    _.throttle = function(func, wait, options) {
        var timeout, context, args, result;
        var previous = 0;
        if (!options) options = {};

        var later = function() {
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };

        var throttled = function() {
            var now = _.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };

        throttled.cancel = function() {
            clearTimeout(timeout);
            previous = 0;
            timeout = context = args = null;
        };

        return throttled;
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    // 返回一个函数，若此函数持续被调用，则不会被触发。该函数在停止调用的N毫秒后会被再次调用。
    // 如果传入`immediate`,debounce会在等待wait时间间隔后触发此函数，而不是使用"trailing"方法。
    _.debounce = function(func, wait, immediate) {
        var timeout, result;

        var later = function(context, args) {
            timeout = null;
            if (args) result = func.apply(context, args);
        };

        var debounced = restArgs(function(args) {
            if (timeout) clearTimeout(timeout);
            if (immediate) {
                var callNow = !timeout;
                timeout = setTimeout(later, wait);
                if (callNow) result = func.apply(this, args);
            } else {
                timeout = _.delay(later, wait, this, args);
            }

            return result;
        });

        debounced.cancel = function() {
            clearTimeout(timeout);
            timeout = null;
        };

        return debounced;
    };

    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    // 将作为参数的第一个参数函数传递到第二个参数，也就意味着在代码运行前后允许修改与调整参数，并附有条件地执行原始函数
    _.wrap = function(func, wrapper) {
        return _.partial(wrapper, func);
    };

    // Returns a negated version of the passed-in predicate.
    // 将符合断言的传入参数取反
    _.negate = function(predicate) {
        return function() {
            return !predicate.apply(this, arguments);
        };
    };

    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    // 根据传入函数队列，返回一个组合后的复合函数。每个函数执行的结果作为下一个函数的传入参数
    _.compose = function() {
        var args = arguments;
        var start = args.length - 1;
        return function() {
            var i = start;
            var result = args[start].apply(this, arguments);
            while (i--) result = args[i].call(this, result);
            return result;
        };
    };

    // Returns a function that will only be executed on and after the Nth call.
    // 创建一个在被执行了Nth次后才有效果的函数（times<=Nth）
    _.after = function(times, func) {
        return function() {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };

    // Returns a function that will only be executed up to (but not including) the Nth call.
    // 创建一个至多被调用指定次数的函数，最后一次函数调用的结果将被记录并返回（times<Nth）
    _.before = function(times, func) {
        var memo;
        return function() {
            if (--times > 0) {
                memo = func.apply(this, arguments);
            }
            if (times <= 1) func = null;
            return memo;
        };
    };

    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    // 创建一个只能调用一次的函数，重复的调用不会取得结果，（只返回第一次执行时的结果）。常用于函数的懒加载（延迟初始化）
    _.once = _.partial(_.before, 2);

    _.restArgs = restArgs;

    // Object Functions
    // 对象函数
    // ----------------

    // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
    // IE9之前的浏览器将不会对'Keys'做迭代。
    var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
        'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

    var collectNonEnumProps = function(obj, keys) {
        var nonEnumIdx = nonEnumerableProps.length;
        var constructor = obj.constructor;
        var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

        // Constructor is a special case.
        // 构造函数是一个特殊的情况
        var prop = 'constructor';
        if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

        while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];
            if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
                keys.push(prop);
            }
        }
    };

    // Retrieve the names of an object's own properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`.
    // 检索对象自己所拥有的（可枚举的）属性名。（如果支持）委托**ECMAScript 5**原生`Object.keys`方法
    _.keys = function(obj) {
        if (!_.isObject(obj)) return [];
        if (nativeKeys) return nativeKeys(obj);
        var keys = [];
        for (var key in obj) if (_.has(obj, key)) keys.push(key);
        // Ahem, IE < 9.
        // 辣鸡IE
        if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };

    // Retrieve all the property names of an object.
    // 检索对象（包括自身和继承）所拥有的（可枚举的）属性名。
    _.allKeys = function(obj) {
        if (!_.isObject(obj)) return [];
        var keys = [];
        for (var key in obj) keys.push(key);
        // Ahem, IE < 9.
        // 辣鸡IE
        if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };

    // Retrieve the values of an object's properties.
    // 检索对象中属性的值。
    _.values = function(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    };

    // Returns the results of applying the iteratee to each element of the object.
    // In contrast to _.map it returns an object.
    // 此方法将迭代器规则(context)应用到某对象所有的元素上，并返回该对象
    // 相较于`_.map`有所不同，它返回了一个对象
    _.mapObject = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        var keys = _.keys(obj),
            length = keys.length,
            results = {};
        for (var index = 0; index < length; index++) {
            var currentKey = keys[index];
            results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    // Convert an object into a list of `[key, value]` pairs.
    // 将一个对象转换为`[key, value]`形式的键值对。
    _.pairs = function(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var pairs = Array(length);
        for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
        }
        return pairs;
    };

    // Invert the keys and values of an object. The values must be serializable.
    // 返回将对象中的键和值置换后的结果。所有的值都必须是可序列化的（多指值唯一，且可以序列化为字符串）
    _.invert = function(obj) {
        var result = {};
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    };

    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`.
    // 返回已排序后的可在对象中使用的所有方法名（注：返回结果为字符串数组），亦叫做`methods`方法
    _.functions = _.methods = function(obj) {
        var names = [];
        for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
        }
        return names.sort();
    };

    // An internal function for creating assigner functions.
    // 用于实现分配器功能的内部函数
    var createAssigner = function(keysFunc, defaults) {
        return function(obj) {
            var length = arguments.length;
            if (defaults) obj = Object(obj);
            if (length < 2 || obj == null) return obj;
            for (var index = 1; index < length; index++) {
                var source = arguments[index],
                    keys = keysFunc(source),
                    l = keys.length;
                for (var i = 0; i < l; i++) {
                    var key = keys[i];
                    if (!defaults || obj[key] === void 0) obj[key] = source[key];
                }
            }
            return obj;
        };
    };

    // Extend a given object with all the properties in passed-in object(s).
    // 将传入对象的所有键值扩展到原对象上（会覆盖前值）
    _.extend = createAssigner(_.allKeys);

    // Assigns a given object with all the own properties in the passed-in object(s).
    // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
    // 将给定对象的自有的（非继承的）属性分配到传入对象上
    // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
    _.extendOwn = _.assign = createAssigner(_.keys);

    // Returns the first key on an object that passes a predicate test.
    // 返回对象中首个通过断言的键值
    _.findKey = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = _.keys(obj), key;
        for (var i = 0, length = keys.length; i < length; i++) {
            key = keys[i];
            if (predicate(obj[key], key, obj)) return key;
        }
    };

    // Internal pick helper function to determine if `obj` has key `key`.
    // 内部分拣辅助函数，用于确定指定的`key`键值是否存在于对象中
    var keyInObj = function(value, key, obj) {
        return key in obj;
    };

    // Return a copy of the object only containing the whitelisted properties.
    // 返回对象的一个副本，副本对象的属性包含于白名单列表（参数`keys`包含了所有的白名单）
    _.pick = restArgs(function(obj, keys) {
        var result = {}, iteratee = keys[0];
        if (obj == null) return result;
        if (_.isFunction(iteratee)) {
            if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
            keys = _.allKeys(obj);
        } else {
            iteratee = keyInObj;
            keys = flatten(keys, false, false);
            obj = Object(obj);
        }
        for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i];
            var value = obj[key];
            if (iteratee(value, key, obj)) result[key] = value;
        }
        return result;
    });

    // Return a copy of the object without the blacklisted properties.
    // 返回对象的一个副本，副本对象的属性包含了除黑名单属性（`keys`参数）以外的所有属性
    _.omit = restArgs(function(obj, keys) {
        var iteratee = keys[0], context;
        if (_.isFunction(iteratee)) {
            iteratee = _.negate(iteratee);
            if (keys.length > 1) context = keys[1];
        } else {
            keys = _.map(flatten(keys, false, false), String);
            iteratee = function(value, key) {
                return !_.contains(keys, key);
            };
        }
        return _.pick(obj, iteratee, context);
    });

    // Fill in a given object with default properties.
    // 使用默认值填充给定对象
    _.defaults = createAssigner(_.allKeys, true);

    // Creates an object that inherits from the given prototype object.
    // If additional properties are provided then they will be added to the
    // created object.
    // 创建具有给定原型的（新）对象，如果含有附加属性(props)，该属性将被（作为自有属性）添加到对象上
    _.create = function(prototype, props) {
        var result = baseCreate(prototype);
        if (props) _.extendOwn(result, props);
        return result;
    };

    // Create a (shallow-cloned) duplicate of an object.
    // 浅克隆一个对象，获取其副本
    _.clone = function(obj) {
        if (!_.isObject(obj)) return obj;
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    // 用给定对象来调用"interceptor"(指传入参数)，并返回对象自身。
    // 该方法的主要目的是将其作为链式调用中的一环，返回对象本身，并使其可以调用后序函数
    _.tap = function(obj, interceptor) {
        interceptor(obj);
        return obj;
    };

    // Returns whether an object has a given set of `key:value` pairs.
    // 返回该对象是否含有`key:value`键值对的布尔表达：存在则返回true；不存在则返回false
    _.isMatch = function(object, attrs) {
        var keys = _.keys(attrs), length = keys.length;
        if (object == null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
            var key = keys[i];
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    };


    // Internal recursive comparison function for `isEqual`.
    // `isEqual`的内部深度对比函数
    var eq, deepEq;
    eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        // 相同的对象是等同的。但例如'0'和'-0'，它们不是绝对相等的。
        // 参见：[Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal)
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // A strict comparison is necessary because `null == undefined`.
        // 严格对比不可或缺，因为存在`null == undefined`的情况
        if (a == null || b == null) return a === b;
        // `NaN`s are equivalent, but non-reflexive.
        // 每个`NaN`对象是等价的，但其并不具备自反性
        if (a !== a) return b !== b;
        // Exhaust primitive checks
        // 较彻底的原始检测
        var type = typeof a;
        if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
        return deepEq(a, b, aStack, bStack);
    };

    // Internal recursive comparison function for `isEqual`.
    // `isEqual`的内部递归比较函数
    deepEq = function(a, b, aStack, bStack) {
        // Unwrap any wrapped objects.
        // 打开所有被包装对象。
        if (a instanceof _) a = a._wrapped;
        if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        // 比较 `[[Class]]` 名
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;
        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            // 由值比较字符串，数字，正则，日期和布尔值
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            // 为了进行比较，需要将正则转化为字符串形式（如：'' + /a/i === '/a/i'）
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                // 原语等效于其相应的对象包装器；由此，`"5"`和`new String("5")`是等价的
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN.
                // 每个`NaN`对象是等价的，但其并不具备自反性。
                // "Object(NaN)"等价于"NaN"
                if (+a !== +a) return +b !== +b;
                // An `egal` comparison is performed for other numeric values.
                // 为了其它数值而推演的`egal`比较
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                // 将日期和布尔值强转为原始数值。日期数据和其相应的毫秒表示进行比较。需要注意的是，不准确的日期数据强转后，不等价于`NaN`
                return +a === +b;
            case '[object Symbol]':
                return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
        }

        var areArrays = className === '[object Array]';
        if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object') return false;

            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            // 除了具有不同框架的`Object`类或者`Array`类，拥有不用构造器的对象不等价
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                _.isFunction(bCtor) && bCtor instanceof bCtor)
                && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
        // 循环结构的等价呈现。检索算法改编自ES5.1 SECTION 15.12.3，抽象操作符`JO`

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        // 初始化对象栈。这里完成这一步是因为这里我们需要对对象或数组进行比较
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            // 线性检索，其性能和嵌套层级深度成反比
            if (aStack[length] === a) return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        // 将第一个对象添加到堆栈遍历对象当中
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        // 对对象与数组进行递归比较
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            // 比较数组长度来确认是否有必要进行深度比较
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            // 忽略非数值属性的前提下对内容做深度比较
            while (length--) {
                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            // Deep compare objects.
            // 对对象做深度比较
            var keys = _.keys(a), key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            // 在做深度属性比较之前，先确认做比较的两者包含的属性个数是否一致
            if (_.keys(b).length !== length) return false;
            while (length--) {
                // Deep compare each member
                // 对每个成员做深度比较
                key = keys[length];
                if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        // Remove the first object from the stack of traversed objects.
        // 移除堆栈遍历对象中的首个对象
        aStack.pop();
        bStack.pop();
        return true;
    };

    // Perform a deep comparison to check if two objects are equal.
    // 执行深度对比来检测两个对象是否相等
    _.isEqual = function(a, b) {
        return eq(a, b);
    };

    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    // 判断给定值是字符串或是空对象
    // 空对象不具有可枚举的自身属性
    _.isEmpty = function(obj) {
        if (obj == null) return true;
        if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
        return _.keys(obj).length === 0;
    };

    // Is a given value a DOM element?
    // 判断给定值是否为DOM元素
    _.isElement = function(obj) {
        return !!(obj && obj.nodeType === 1);
    };

    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    // 判断给定值是否为数组，这里使用ES5原生`Array.isArray`方法进行判断
    _.isArray = nativeIsArray || function(obj) {
            return toString.call(obj) === '[object Array]';
        };

    // Is a given variable an object?
    // 判断给定值是否为对象
    _.isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.
    // 添加"isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet"等"isType"方法
    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(name) {
        _['is' + name] = function(obj) {
            return toString.call(obj) === '[object ' + name + ']';
        };
    });

    // Define a fallback version of the method in browsers (ahem, IE < 9), where
    // there isn't any inspectable "Arguments" type.
    // 为不具备可检验 "Arguments" 类型的IE9之前版本的浏览器定义一个方法的回调版本
    if (!_.isArguments(arguments)) {
        _.isArguments = function(obj) {
            return _.has(obj, 'callee');
        };
    }

    // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
    // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
    // 在适当的场景下完善（增强）`isFunction`函数。在老的v8引擎中会有一些小的bug
    var nodelist = root.document && root.document.childNodes;
    if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
        _.isFunction = function(obj) {
            return typeof obj == 'function' || false;
        };
    }

    // Is a given object a finite number?
    // 给定值为有限值的情况
    _.isFinite = function(obj) {
        return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
    };

    // Is the given value `NaN`?
    // 给定值为"NaN"类型的情况
    _.isNaN = function(obj) {
        return _.isNumber(obj) && isNaN(obj);
    };

    // Is a given value a boolean?
    // 给定值为布尔值的情况
    _.isBoolean = function(obj) {
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    // Is a given value equal to null?
    // 给定值为null值的情况
    _.isNull = function(obj) {
        return obj === null;
    };

    // Is a given variable undefined?
    // 给定变量未定义的情况
    _.isUndefined = function(obj) {
        return obj === void 0;
    };

    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    // 检测对象是否含有给定键（自有的，所以并不是指原型上含有的，而是自身的）的缩略函数
    _.has = function(obj, key) {
        return obj != null && hasOwnProperty.call(obj, key);
    };

    // Utility Functions
    // 实用函数
    // -----------------

    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    // 在无冲模式下运行Underscore.js时，会返回之前创建的变量"_"，否则返回Underscore对象的引用
    _.noConflict = function() {
        root._ = previousUnderscore;
        return this;
    };

    // Keep the identity function around for default iteratees.
    // 始终为默认迭代器添加恒等函数
    _.identity = function(value) {
        return value;
    };

    // Predicate-generating functions. Often useful outside of Underscore.
    // 常用于Underscore外部的断言产生函数
    _.constant = function(value) {
        return function() {
            return value;
        };
    };

    _.noop = function(){};

    _.property = property;

    // Generates a function for a given object that returns a given property.
    // 为给定的对象创建一个返回指定属性的函数
    _.propertyOf = function(obj) {
        return obj == null ? function(){} : function(key) {
            return obj[key];
        };
    };

    // Returns a predicate for checking whether an object has a given set of
    // `key:value` pairs.
    // 返回一个检测给定的对象是否匹配attrs指定键值对的断言函数
    _.matcher = _.matches = function(attrs) {
        attrs = _.extendOwn({}, attrs);
        return function(obj) {
            return _.isMatch(obj, attrs);
        };
    };

    // Run a function **n** times.
    // 运行某函数**n**次
    _.times = function(n, iteratee, context) {
        var accum = Array(Math.max(0, n));
        iteratee = optimizeCb(iteratee, context, 1);
        for (var i = 0; i < n; i++) accum[i] = iteratee(i);
        return accum;
    };

    // Return a random integer between min and max (inclusive).
    // 随机返回指定范围内的整数值，包含边界（例 0,10 ，可能返回0或10）
    _.random = function(min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };

    // A (possibly faster) way to get the current timestamp as an integer.
    // （尽可能快地）获取当前时间戳的整数形式
    _.now = Date.now || function() {
            return new Date().getTime();
        };

    // List of HTML entities for escaping.
    // 需进行转义处理的HTML字符列表
    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
    };
    var unescapeMap = _.invert(escapeMap);

    // Functions for escaping and unescaping strings to/from HTML interpolation.
    // 字符串到HTML插值之间的转义函数与转回函数
    var createEscaper = function(map) {
        var escaper = function(match) {
            return map[match];
        };
        // Regexes for identifying a key that needs to be escaped.
        // 通过正则识别需要进行转义的关键字
        var source = '(?:' + _.keys(map).join('|') + ')';
        var testRegexp = RegExp(source);
        var replaceRegexp = RegExp(source, 'g');
        return function(string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
    };
    _.escape = createEscaper(escapeMap);
    _.unescape = createEscaper(unescapeMap);

    // If the value of the named `property` is a function then invoke it with the
    // `object` as context; otherwise, return it.
    // 如果指定的property的值是一个函数，那么将在`object`上下文内调用它；否则，返回该值
    _.result = function(object, prop, fallback) {
        var value = object == null ? void 0 : object[prop];
        if (value === void 0) {
            value = fallback;
        }
        return _.isFunction(value) ? value.call(object) : value;
    };

    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    // 为客户端模型（如果需要）或DOM元素生成一个全局唯一的id
    var idCounter = 0;
    _.uniqueId = function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    };

    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    // 默认情况下，Underscore使用ERB风格的分隔符，改变如下设置从而使用替代的分隔符
    _.templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    // 当自定义`templateSettings`后，如果你不想去自定义一个覆盖模板、标准或正则时，为此需要创建一个"noMatch"表达式
    var noMatch = /(.)^/;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    // 一些需要被特殊对待的编码转义
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

    var escapeChar = function(match) {
        return '\\' + escapes[match];
    };

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    // NB: `oldSettings` only exists for backwards compatibility.
    // JavaScript的微模版，和John Resig（jQuery的作者）采用的实现方法类似。
    // US模板可以使用任意闭合字符（类似{...},<%...%>）来执行js代码，使用HTML转义（{-..},<%-...%>）来插入一个数值或变量。
    // 如果要向后兼容，请使用`oldSettings`
    _.template = function(text, settings, oldSettings) {
        if (!settings && oldSettings) settings = oldSettings;
        settings = _.defaults({}, settings, _.templateSettings);

        // Combine delimiters into one regular expression via alternation.
        // 通过交替组合分隔符，来产生一个正则表达式
        var matcher = RegExp([
                (settings.escape || noMatch).source,
                (settings.interpolate || noMatch).source,
                (settings.evaluate || noMatch).source
            ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        // 编译模板源码，对特殊字符做恰当的转码
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
            index = offset + match.length;

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            } else if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }

            // Adobe VMs need the match returned to produce the correct offset.
            // Adobe虚拟机需要返回根据匹配生成的精确偏移量
            return match;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.
        // 如果一个变量未被明确定义，其数据应该只被存放于局部范围内
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + 'return __p;\n';

        var render;
        try {
            render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        var template = function(data) {
            return render.call(this, data, _);
        };

        // Provide the compiled source as a convenience for precompilation.
        // 为快捷预编译提供编译源码
        var argument = settings.variable || 'obj';
        template.source = 'function(' + argument + '){\n' + source + '}';

        return template;
    };

    // Add a "chain" function. Start chaining a wrapped Underscore object.
    // 添加一个"chain"函数来链接所有被包装的Underscore对象。
    _.chain = function(obj) {
        var instance = _(obj);
        instance._chain = true;
        return instance;
    };

    // OOP
    // 面向对象编程（Object Oriented Programming）
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.
    // 如果Underscore被当做函数来调用，它将返回一个能被用做面向对象的封装对象。该封装保留了Underscore函数的所有修改版本。封装对象有可能是链式的

    // Helper function to continue chaining intermediate results.
    // 链式函数调用中获取中间值的辅助函数
    var chainResult = function(instance, obj) {
        return instance._chain ? _(obj).chain() : obj;
    };

    // Add your own custom functions to the Underscore object.
    // 为Underscore对象添加自定义函数
    _.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function() {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return chainResult(this, func.apply(_, args));
            };
        });
        return _;
    };

    // Add all of the Underscore functions to the wrapper object.
    // 将所有的Underscore函数封装
    _.mixin(_);

    // Add all mutator Array functions to the wrapper.
    // 封装所有的数组操作函数
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return chainResult(this, obj);
        };
    });

    // Add all accessor Array functions to the wrapper.
    // 封装所有的数组访问函数
    _.each(['concat', 'join', 'slice'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            return chainResult(this, method.apply(this._wrapped, arguments));
        };
    });

    // Extracts the result from a wrapped and chained object.
    // 提取链式封装对象的值
    _.prototype.value = function() {
        return this._wrapped;
    };

    // Provide unwrapping proxy for some methods used in engine operations
    // such as arithmetic and JSON stringification.
    // 为一些引擎中的数据操作方法提供方向可逆代理，如JSON的字符串互转，算数的逆运算等
    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    _.prototype.toString = function() {
        return String(this._wrapped);
    };

    // AMD registration happens at the end for compatibility with AMD loaders
    // that may not enforce next-turn semantics on modules. Even though general
    // practice for AMD registration is to be anonymous, underscore registers
    // as a named module because, like jQuery, it is a base library that is
    // popular enough to be bundled in a third party lib, but not be part of
    // an AMD load request. Those cases could generate an error when an
    // anonymous define() is called outside of a loader request.
    // AMD，Asynchronous Module Definition 异步模块定义
    // 在需要进行AMD兼容时，进行AMD注册，此时不得不使用强制语义模块。
    // 尽管通常AMD注册是匿名的，但Underscore则注册为一个命名的模块，就像jQuery一样，毕竟它是一个很流行的第三方库，但却不是AMD必不可少的加载模块。
    // （如果使用匿名注册）这种情况下，当匿名定义被外部的调用者调用时，就会产生错误。
    if (typeof define == 'function' && define.amd) {
        define('underscore', [], function() {
            return _;
        });
    }
}());
