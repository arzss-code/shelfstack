<script setup lang="ts">
import { computed } from 'vue'
import type { ProductReview } from '~/types/review'
import { formatReviewerName, formatReviewDate } from '~/utils/format'

const props = defineProps<{
  review: ProductReview
}>()

const maskedName = computed(() => {
  if (props.review.reviewer_name) {
    return props.review.reviewer_name
  }
  return formatReviewerName(props.review.user_name || props.review.user_email)
})

const formattedDate = computed(() => {
  return formatReviewDate(props.review.created_at)
})
</script>

<template>
  <UiCard :padded="true" class="bg-brand-canvas border-brand-hair shadow-whisper">
    <div class="space-y-3">
      <!-- Header: Masked Reviewer Name & Date (Strictly No Gaudy Verified Badges) -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-canvas-soft border border-brand-hair text-xs font-semibold text-brand-ink"
            aria-hidden="true"
          >
            {{ maskedName.charAt(0) }}
          </div>
          <span class="truncate font-display text-sm font-semibold text-brand-ink">
            {{ maskedName }}
          </span>
        </div>
        <time
          v-if="formattedDate"
          :datetime="review.created_at"
          class="shrink-0 font-body text-xs text-brand-muted"
        >
          {{ formattedDate }}
        </time>
      </div>

      <!-- Rating Stars -->
      <div
        role="img"
        class="flex items-center gap-1"
        :aria-label="`Rating ${review.rating} dari 5 bintang`"
      >
        <i
          v-for="star in 5"
          :key="star"
          :class="[
            'pi',
            star <= review.rating ? 'pi-star-fill text-amber-400' : 'pi-star text-stone-200',
            'text-xs',
          ]"
        />
      </div>

      <!-- Review Text Content -->
      <p class="m-0 font-body text-sm leading-relaxed text-brand-ink/90 whitespace-pre-line">
        {{ review.review_text }}
      </p>
    </div>
  </UiCard>
</template>
