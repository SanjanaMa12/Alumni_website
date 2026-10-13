import FacultyGrid from '../components/FacultyGrid.jsx'

const WAYS_TO_CONTRIBUTE = [
  'Mentor and guide the next generation of students.',
  'Support scholarships and student initiatives.',
  'Contribute to research and development.',
  'Share career opportunities and internships.',
  'Continue to be part of the University’s growth and progress.',
]

export default function Home() {
  return (
    <>
      {/* Video hero */}
      <section className="relative overflow-hidden py-12">
        <div className="absolute inset-0">
          <img src="/images/images.jpg" alt="" className="h-full w-full scale-110 object-cover blur-[6px]" />
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-maroon/5" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
            <div className="aspect-video">
              <video autoPlay muted loop playsInline className="h-full w-full object-cover">
                <source src="/video/campus_w.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="bg-white p-5">
              <h2 className="text-xl font-bold text-maroon">Welcome to the Global Alumni Family</h2>
              <p className="mt-2 text-sm text-gray-600">University of Peradeniya Alumni Relations</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/J28JWHHxjao?start=165&end=182&mute=1"
                title="Message from the Vice Chancellor"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
            <div className="bg-white p-5">
              <h2 className="text-xl font-bold text-maroon">Message from the Vice Chancellor</h2>
              <p className="mt-2 text-sm text-gray-600">
                A message from the Vice Chancellor of the University of Peradeniya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Message from the Alumni Relations Office */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="card flex flex-col gap-8 p-6 sm:p-8 md:flex-row">
          <div className="h-48 w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 md:w-48">
            <img src="/images/senate.jpg" className="h-full w-full object-cover" alt="University of Peradeniya" />
          </div>
          <div className="flex-1 text-sm leading-relaxed text-gray-600">
            <h2 className="text-2xl font-bold text-maroon">Message from Alumni Relationship Office</h2>
            <p className="mt-4 text-base">Welcome to the Alumni Family!</p>
            <p className="mt-4">
              We are truly delighted to welcome you back to your alma mater — the University of Peradeniya, a place
              where lifelong friendships are formed, knowledge is shared, and memories are created.
            </p>
            <p className="mt-1">
              The Alumni Relations Office (ARO) is dedicated to nurturing a lifelong and meaningful connection between
              the University and its diverse alumni community across Sri Lanka and around the world. Through the
              Alumni Relations Office (ARO), we provide a platform for you to reconnect with your fellow Peradeniya
              alumni, faculty, juniors, and the wider university community.
            </p>
            <p className="mt-4">As a member of our alumni family, you can contribute by:</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              {WAYS_TO_CONTRIBUTE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4">
              The ARO portal also brings you closer to the traditions and experiences that make Peradeniya special —
              from our Annual Open Day, Drama Festivals, and Faculty Reunions to new opportunities for alumni to
              connect, collaborate, and give back.
            </p>
            <p className="mt-4">
              Whether you graduated recently or many years ago, Peradeniya will always be a part of your story. Once a
              Peradeniyan, always a Peradeniyan.
            </p>
          </div>
        </div>
      </section>

      {/* Faculties */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <h2 className="mb-2 text-2xl font-bold text-maroon">Register with your Faculty</h2>
        <p className="mb-8 text-sm text-gray-600">Select your faculty to join the alumni network.</p>
        <FacultyGrid />
      </section>
    </>
  )
}
