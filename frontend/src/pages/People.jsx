import { useApi } from '../api/useApi.js'
import { ErrorMessage, Loading } from '../components/Status.jsx'

function initials(name) {
  return name
    .split(/\s+/)
    .filter((w) => w && !/^(name|of)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function Avatar({ person, size, ring }) {
  return (
    <div
      className={`${size} mx-auto flex items-center justify-center overflow-hidden rounded-full bg-maroon/10 text-2xl font-bold text-maroon ${ring}`}
    >
      {person.photo ? (
        <img src={`/${person.photo}`} alt={person.name} className="h-full w-full object-cover" />
      ) : (
        initials(person.name) || '?'
      )}
    </div>
  )
}

function FeaturedCard({ person }) {
  return (
    <div className="card mx-auto max-w-md p-7 text-center">
      <Avatar person={person} size="h-40 w-40" ring="border-4 border-gold" />
      <h3 className="mt-5 text-xl font-bold text-gray-800">{person.name}</h3>
      <p className="mt-1 font-medium text-maroon">{person.designation}</p>
      <p className="text-sm text-gray-500">University of Peradeniya</p>
    </div>
  )
}

function MemberCard({ person }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
      <Avatar person={person} size="h-28 w-28" ring="" />
      <h3 className="mt-4 font-semibold text-gray-800">{person.name}</h3>
      <p className="mt-1 text-sm text-maroon">{person.designation}</p>
    </div>
  )
}

function Group({ title, subtitle, children }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-maroon">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

export default function People() {
  const { data, error, loading, reload } = useApi('/people')

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-8 text-center sm:px-6">
        <p className="text-sm font-semibold tracking-widest text-maroon uppercase">Alumni Relations Office</p>
        <h1 className="mt-3 text-3xl font-bold text-maroon md:text-4xl">Patrons</h1>
        <p className="mx-auto mt-4 max-w-3xl leading-relaxed text-gray-600">
          The Alumni Relations Office works closely with University leadership, the Advisory Committee - Overseas
          Alumni Chapters, and Advisory Committee - University of Peradeniya to strengthen connections between the
          University of Peradeniya and its alumni community.
        </p>
      </section>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (
        <>
          <Group title="University Leadership">
            {data.groups.leadership.map((p) => (
              <FeaturedCard key={p.id} person={p} />
            ))}
          </Group>

          <Group
            title="Advisory Committee - Overseas Alumni Chapters"
            subtitle="Advisory Committee of the Alumni Relations Office"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.groups.overseas_advisory.map((p) => (
                <MemberCard key={p.id} person={p} />
              ))}
            </div>
          </Group>

          <Group title="Advisory Committee - University of Peradeniya">
            <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2">
              {data.groups.university_advisory.map((p) => (
                <MemberCard key={p.id} person={p} />
              ))}
            </div>
          </Group>

          <Group title="Alumni Relations Office">
            {data.groups.aro.map((p) => (
              <FeaturedCard key={p.id} person={p} />
            ))}
          </Group>
        </>
      )}
    </>
  )
}
