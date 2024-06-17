
@function main(int argc, char[] argv) {
    @push "to call malloc()...";
    @system 4;

    @call malloc(1024); # 1kb
    @push $ax;
    @system 4;

    @push "called malloc()";
    @system 4;

    @push "Great Success!";
    @system 4;
};
