import React from "react";
import "../styles/DogLoader.css"; // import CSS riêng cho loader

const DogLoader = () => {
    return (
        <div className="dog-loader-overlay">
            <div className="dog-loader-main">
                <div className="dog-loader-dog">
                    <div className="dog-loader-paws">
                        <div className="dog-loader-bl-leg dog-loader-leg">
                            <div className="dog-loader-bl-paw dog-loader-paw"></div>
                            <div className="dog-loader-bl-top dog-loader-top"></div>
                        </div>
                        <div className="dog-loader-fl-leg dog-loader-leg">
                            <div className="dog-loader-fl-paw dog-loader-paw"></div>
                            <div className="dog-loader-fl-top dog-loader-top"></div>
                        </div>
                        <div className="dog-loader-fr-leg dog-loader-leg">
                            <div className="dog-loader-fr-paw dog-loader-paw"></div>
                            <div className="dog-loader-fr-top dog-loader-top"></div>
                        </div>
                    </div>

                    <div className="dog-loader-body">
                        <div className="dog-loader-tail"></div>
                    </div>

                    <div className="dog-loader-head">
                        <div className="dog-loader-snout">
                            <div className="dog-loader-eyes">
                                <div className="dog-loader-eye-l"></div>
                                <div className="dog-loader-eye-r"></div>
                            </div>
                        </div>
                    </div>

                    <div className="dog-loader-head-c">
                        <div className="dog-loader-ear-r"></div>
                        <div className="dog-loader-ear-l"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DogLoader;
