package com.midori.ai.key;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for OpenRouterKeyManager.
 */
class OpenRouterKeyManagerTest {

    @Test
    @DisplayName("Mask: first 4 + ... + last 4 chars")
    void maskWorks() {
        // mask() returns: first 4 chars + "..." + last 4 chars
        // For "sk-or-v1-test123456789abcdefghijklmnop" (31 chars):
        //   first 4: "sk-o", last 4: "mnop" -> "sk-o...mnop"
        assertEquals("sk-o...mnop", OpenRouterKeyManager.mask("sk-or-v1-test123456789abcdefghijklmnop"));
        assertEquals("***", OpenRouterKeyManager.mask("short"));
        assertEquals("***", OpenRouterKeyManager.mask(null));
        assertEquals("***", OpenRouterKeyManager.mask(""));
        // Edge case: exactly 8 chars -> "***" (not enough chars for masking)
        assertEquals("***", OpenRouterKeyManager.mask("12345678"));
        // 9 chars: "1234...6789"
        assertEquals("1234...6789", OpenRouterKeyManager.mask("123456789"));
    }

    @Test
    @DisplayName("Two keys: round-robin rotation")
    void roundRobinRotation() {
        String[] keys = {"key1", "key2"};
        OpenRouterKeyManager mgr = new OpenRouterKeyManager(keys);

        assertEquals(2, mgr.getTotalKeyCount());
        assertEquals(2, mgr.getRemainingKeyCount());
        assertEquals("key1", mgr.getCurrentKey());
        assertEquals("key2", mgr.getNextKey());
        assertEquals("key1", mgr.getNextKey());
    }

    @Test
    @DisplayName("Three keys: rotation")
    void threeKeysRotation() {
        String[] keys = {"key1", "key2", "key3"};
        OpenRouterKeyManager mgr = new OpenRouterKeyManager(keys);

        assertEquals("key1", mgr.getCurrentKey());
        assertEquals("key2", mgr.getNextKey());
        assertEquals("key3", mgr.getNextKey());
        assertEquals("key1", mgr.getNextKey());
    }

    @Test
    @DisplayName("Exclude key: remaining count decrements")
    void excludeKeyDecrementsCount() {
        String[] keys = {"key1", "key2"};
        OpenRouterKeyManager mgr = new OpenRouterKeyManager(keys);

        assertEquals(2, mgr.getRemainingKeyCount());
        mgr.excludeKey("key1");
        assertEquals(1, mgr.getRemainingKeyCount());
        assertEquals("key2", mgr.getCurrentKey());
    }

    @Test
    @DisplayName("Exclude all keys: getCurrentKey returns null")
    void excludeAllKeysReturnsNull() {
        String[] keys = {"key1", "key2"};
        OpenRouterKeyManager mgr = new OpenRouterKeyManager(keys);

        mgr.excludeKey("key1");
        mgr.excludeKey("key2");
        assertEquals(0, mgr.getRemainingKeyCount());
        assertNull(mgr.getCurrentKey());
        assertNull(mgr.getNextKey());
    }

    @Test
    @DisplayName("Null/empty keys: gracefully handles")
    void nullKeysHandled() {
        OpenRouterKeyManager mgr = new OpenRouterKeyManager(null);
        assertEquals(0, mgr.getTotalKeyCount());
        assertEquals(0, mgr.getRemainingKeyCount());
        assertNull(mgr.getCurrentKey());
    }

    @Test
    @DisplayName("Single key: always returns same key")
    void singleKeyAlwaysSame() {
        String[] keys = {"only-key"};
        OpenRouterKeyManager mgr = new OpenRouterKeyManager(keys);

        assertEquals("only-key", mgr.getCurrentKey());
        assertEquals("only-key", mgr.getNextKey());
        assertEquals("only-key", mgr.getNextKey());
        assertEquals(1, mgr.getRemainingKeyCount());
    }

    @Test
    @DisplayName("Exclude non-existent key: no-op")
    void excludeNonExistentNoOp() {
        String[] keys = {"key1"};
        OpenRouterKeyManager mgr = new OpenRouterKeyManager(keys);

        mgr.excludeKey("non-existent");
        assertEquals(1, mgr.getRemainingKeyCount());
        assertEquals("key1", mgr.getCurrentKey());
    }

    @Test
    @DisplayName("CurrentKeyIndex returns 0-based index")
    void currentKeyIndexReturnsZeroBased() {
        String[] keys = {"key1", "key2"};
        OpenRouterKeyManager mgr = new OpenRouterKeyManager(keys);

        assertEquals(0, mgr.getCurrentKeyIndex());
        mgr.getNextKey();
        assertEquals(1, mgr.getCurrentKeyIndex());
    }
}
