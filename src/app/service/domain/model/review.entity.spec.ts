import { Review } from '@service/domain/model/review.entity';

describe('Review', () => {
  it('averages its communication, efficacy and performance scores', () => {
    const review = new Review({
      id: 1,
      service_request_id: 4,
      technician_profile_id: 1,
      rating: { communication: 5, efficacy: 4, performance: 3 },
      comment: '',
    });

    expect(review.calculateAverage()).toBe(4);
  });
});
