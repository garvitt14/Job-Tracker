router.get('/', auth, async (req, res) => { ... })      // ✅ has auth
router.post('/', auth, async (req, res) => { ... })      // ✅ has auth
router.put('/:id', auth, async (req, res) => { ... })    // ✅ has auth

router.delete('/:id', async (req, res) => {              // ❌ missing auth!
  ...
  const job = await Job.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id     // req.user is undefined without auth middleware
  })