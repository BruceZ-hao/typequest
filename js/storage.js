(function initTypeQuestStorage(global) {
    const memoryStore = Object.create(null);

    function createMemoryStorage() {
        return {
            getItem(key) {
                return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
            },
            setItem(key, value) {
                memoryStore[key] = String(value);
            },
            removeItem(key) {
                delete memoryStore[key];
            },
            clear() {
                Object.keys(memoryStore).forEach((key) => {
                    delete memoryStore[key];
                });
            }
        };
    }

    function createStorage() {
        try {
            const probeKey = "__typequest_storage_probe__";
            global.localStorage.setItem(probeKey, "ok");
            global.localStorage.removeItem(probeKey);
            return global.localStorage;
        } catch (error) {
            console.warn("TypeQuest localStorage unavailable, using memory fallback.", error);
            return createMemoryStorage();
        }
    }

    global.typeQuestStorage = createStorage();
})(window);
