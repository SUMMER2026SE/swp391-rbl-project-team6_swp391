package com.midori.scheduler;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import static org.assertj.core.api.Assertions.assertThat;

class SchedulerConditionalTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(TestConfig.class, DictionaryTranslationScheduler.class);

    @Test
    void whenPropertyFalse_thenBeanAbsent() {
        this.contextRunner
                .withPropertyValues("dictionary.translation.scheduler-enabled=false")
                .run(context -> assertThat(context).doesNotHaveBean(DictionaryTranslationScheduler.class));
    }

    @Test
    void whenPropertyTrue_thenBeanPresent() {
        this.contextRunner
                .withPropertyValues("dictionary.translation.scheduler-enabled=true")
                .run(context -> assertThat(context).hasSingleBean(DictionaryTranslationScheduler.class));
    }

    @Test
    void whenPropertyMissing_thenBeanPresent() {
        this.contextRunner
                .run(context -> assertThat(context).hasSingleBean(DictionaryTranslationScheduler.class));
    }

    static class TestConfig {
        @org.springframework.context.annotation.Bean
        com.midori.service.DictionaryTranslationService dictionaryTranslationService() {
            return org.mockito.Mockito.mock(com.midori.service.DictionaryTranslationService.class);
        }
    }
}
