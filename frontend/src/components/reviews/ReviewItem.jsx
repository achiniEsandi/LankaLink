import { Stars } from './Stars'

const date = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function ReviewItem({ review, providerName, children }) {
  return (
    <li className={`review${review.hidden ? ' review--hidden' : ''}`}>
      <div className="review__head">
        <span className="review__avatar" aria-hidden="true">
          {review.customerName?.[0] ?? '?'}
        </span>
        <div>
          <p className="review__name">{review.customerName}</p>
          <p className="review__meta">
            <Stars value={review.rating} size={14} /> · {date(review.createdAt)}
          </p>
        </div>
      </div>
      {review.comment && <p className="review__text">{review.comment}</p>}
      {review.reply?.text && (
        <div className="review__reply">
          <p className="review__reply-name">Reply from {providerName ?? 'the provider'}</p>
          <p>{review.reply.text}</p>
        </div>
      )}
      {children}
    </li>
  )
}
